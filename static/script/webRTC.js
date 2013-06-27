


window.RTCPeerConnection || (window.RTCPeerConnection = window.webkitRTCPeerConnection);   //peerConnection 兼容接口....
window.URL || (window.URL = window.webkitURL);              // URL 对象
navigator.getUserMedia || (navigator.getUserMedia = navigator.webkitGetUserMedia);  


//--------------------------------用来前期建立连接,管理多个连接对象----------------
var WebRTC = Class.extend({
	init : function(div){
		this.pc = {};
		this.videoOrAudio = {audio: true,video: false};
		this.localStream = null;
		this.localUser = u.username;
		this.div = div;
		this.localVideo = null;
		this.getLocalUserMedia();
	},
	//end init
	//---------------------广播连接请求---------------------------
	broadcast : function(){
		var msg = {
			"from" : this.localUser,
			"type" : "ask",
			"state" : 1 ,
			"msg" : null,
		};
		this.sendMs({
			a: 4,
			de : "1",
			ms: msg,
			t: null
		});
		console.log("broadcast is send!");
	},
	//end broadcast
	//--------消息类型处理----
	//--------msHander-----
	msHander : function(data){
		//先检查是否能够获取到本地媒体流
		if (this.localStream === null) {
			var sendMsg = {
						"from" : this.localUser,
						"type" : "ack",
						"state" : 0,
						"msg" : "remote ::" + this.localUser + " 不能连接到摄像头或mic",
					};
					this.sendMs({
						a: 4,
						de : data.de,
						ms: sendMsg,
						t: null
					});
				return;
		};


		var msg = data.ms;
		//alert(msg);
		if (msg.state === 1) {
			switch(msg.type){
			case 'ask':{
				console.log('recieve ask from :: ' + msg.from);
				this.handleAsk(msg);
				
			} break;

			case 'askAndAck':{
				console.log('recieve askAndAck from :: ' + msg.from);
				this.handleAskAndAck(msg);
				
			} break;

			case 'ack':{
				console.log('recieve ack from :: ' + msg.from);
				this.handleAck(msg);
				
			} break;

			case 'offer':{

				console.log('recieve offer from :: ' + msg.from);

				if (this.pc[msg.from]) {
					var self = this;
	  				var remoteMedioDOM = null
	  				if (this.videoOrAudio.video) {
    					this.pc[msg.from].remoteMedioDOM = document.createElement("video");
    					//this.div.appendChild(remoteVideoDOM);
    				}else{
    					this.pc[msg.from].remoteMedioDOM = document.createElement("audio");
    					//this.div.appendChild(remoteAudioDOM);
    				};
    				this.pc[msg.from].remoteMedioDOM.id = msg.from + "Media";
    				this.div.appendChild(this.pc[msg.from].remoteMedioDOM);

	  				//init (stream,div,videoOrAudio,remoteUser)
    				// stream ---本地媒体流
					// div ---- 播放媒体的 DOM  {remote: DOM, local: DOM}
					// videoOrAudio  ---媒体流类型{audio: true, video: true}
					// remoteUser ----连接目
					console.log('begin answer for::' + msg.from);
    				
    				this.pc[msg.from].peer = new WebRTCAnswer(this.localStream,{remote: this.pc[msg.from].remoteMedioDOM, local: this.localVideo},this.videoOrAudio,msg.from);
	  				if (this.pc[msg.from].peer.handleOffer) {
	  					this.pc[msg.from].peer.handleOffer(msg.msg);
	  				};
	  				
				} else{
					var sendMsg = {
						"from" : this.localUser,
						"type" : "offer",
						"state" : 0,
						"msg" : "remote ::" + this.localUser + " has no PeerConnection ",
					};
					this.sendMs({
						a: 4,
						de : msg.from,
						ms: sendMsg,
						t: null
					});
				};
				
				
			} break;

			case 'answer':{
				console.log('recieve answer from :: ' + msg.from);
				if (this.pc[msg.from]) {

					this.pc[msg.from].peer.handleAnswer(msg.msg);

				} else{
					var sendMsg = {
						"from" : this.localUser,
						"type" : "answer",
						"state" : 0,
						"msg" : "remote ::" + this.localUser + "has no PeerConnection ",
					};
					this.sendMs({
						a: 4,
						de : msg.from,
						ms: sendMsg,
						t: null
					});
				};
			} break;
			case 'candidate':{
				console.log('recieve candidate from :: ' + msg.from);
				if (this.pc[msg.from]) {
					this.pc[msg.from].peer.handleIceCandidate(msg.msg);
				}else{
					/*var sendMsg = {
						"from" : this.localUser,
						"type" : "candidate",
						"state" : 0,
						"msg" : "remote ::" + this.localUser + " not set up PeerConnection cannot handle iceCandidate",
					};
					this.sendMs({
						a: 4,
						de : msg.from,
						ms: sendMsg,
						t: null
					});*/
					console.log("fail to handle iceCandidate " + msg.from);
				};
			}break;
			case 'bye' : {
				this.closeOneConn(msg.from);
				console.log('recive bye from' + msg.from + "close conn with him" );
			} break;
		///end switch	
			}
		} else{
			console.log('remote ::' + msg.from +":: bad response!!\n"  + 'state::' + msg.state + 'msg::' + msg.msg);
			alert('远端出错了, 因为:' + msg.msg);
			if (this.pc[msg.from]) {
				delete this.pc[msg.from];
			}else{

			};
		};
	},
	//end msHander
	
	//---------处理ask-------
	handleAsk : function(msg){
		if (!this.pc[msg.from]) {
			var sendMsg = {
						"from" : this.localUser,
						"type" : "askAndAck",
						"state" : 1,
						"msg" : null,
					};
		   this.sendMs({
						a: 4,
						de : msg.from,
						ms: sendMsg,
						t: null
					});

		   console.log('send askAndAck to ::' + msg.from );

		};
	},
	//end handleAsk
	//---------处理askAndAck----
	handleAskAndAck : function(msg){
		if (!this.pc[msg.from]) {

			this.pc[msg.from] = {
				peer:null,
	  			remoteMedioDOM: null,

			};//把 msg.from 加入栈
			var sendMsg = {
						"from" : this.localUser,
						"type" : "ack",
						"state" : 1,
						"msg" : null,
					};
		   this.sendMs({
						a: 4,
						de : msg.from,
						ms: sendMsg,
						t: null
					});

		   console.log('add ' + msg.from+' And send ack to ::' + msg.from );

		};
	},
	//end handleAskAndAck
	//--------处理Ack------
	  handleAck : function(msg){
	  	this.pc[msg.from] = {
	  		peer:null,
	  		remoteMedioDOM: null,
	  	};
	  	var remoteMedioDOM = null
	  	if (this.videoOrAudio.video) {
    		this.pc[msg.from].remoteMedioDOM = document.createElement("video");
    		//this.div.appendChild(remoteVideoDOM);
    	}else{
    		this.pc[msg.from].remoteMedioDOM = document.createElement("audio");
    		//this.div.appendChild(remoteAudioDOM);
    	};
    	this.pc[msg.from].remoteMedioDOM.id = msg.from + 'Media'
    	this.div.appendChild(this.pc[msg.from].remoteMedioDOM);

	  	//init (stream,div,videoOrAudio,remoteUser)
    	// stream ---本地媒体流
		// div ---- 播放媒体的 DOM  {remote: DOM, local: DOM}
		// videoOrAudio  ---媒体流类型{audio: true, video: true}
		// remoteUser ----连接目
		console.log('begin createPeer for::' + msg.from);
    	this.pc[msg.from].peer = new WebRTCOffer(this.localStream,{remote: this.pc[msg.from].remoteMedioDOM, local: this.localVideo},this.videoOrAudio,msg.from);
	  },
	//end handleAck
	//----------getLocalUserMedia
	getLocalUserMedia : function(){
	   var self = this;
		navigator.getUserMedia(self.videoOrAudio,function(stream){
			self.onUserMediaSuccess(stream);
		},function(error){
			self.onUserMediaError(error)
		});
	},
	//end getLocalUserMedia
	//-------------onUserMediaSuccess
	onUserMediaSuccess:function(stream){
		console.log("User has granted access to local media.");
    	var url = URL.createObjectURL(stream);
    	if (this.videoOrAudio.video) {
    		 this.localVideo = document.createElement("video");
    		 this.localVideo.id = this.localUser + "Video";
    		 this.div.appendChild(this.localVideo);
    		 this.localVideo.src = url;
    	}else{
    		//var remoteAudio = document.createElement("audio");
    	};
    	this.localStream = stream;
    	this.broadcast();
    	
	},
	//end onUserMediaSuccess
	//------------onUserMediaError
	onUserMediaError : function(error){
		console.log("Failed to get access to local media. Error code was " + error.code);
   		alert("Failed to get access to local media. Error code was " + error.code + ".");
	},
	//end onUserMediaError
	//----------sendMs
	sendMs : function(msg){
		websocketHelper.sendMs(msg.a,msg.de,msg.ms,msg.t);
		/*
		websocketHelper.sendMs({
			a: 4,
			de : "1",
			ms: msg,
			t: null
		});
		*/
	},
	//end sendMs
	//----- 关闭和某人的连接
	closeOneConn :function(username){
		if (this.pc[username]) {
			var dom = this.pc[username].remoteMedioDOM
				dom.parentNode.removeChild(dom);//删除节点
				this.pc[username].peer.stop(); //关闭连接
			//this.pc[username].remoteMedioDOM//
			delete this.pc[username]; //清除记录 ,方便下次连接
		};
		console.log('you closed the conn with' + username);
	},
	//
	//----关闭所有人的连接--------
	closeAllConn : function(){
		for(var p in this.pc){
			this.closeOneConn(p);
		}
	},
	//end closeAllConn


	//-------------其他函数添加区域,主要是对已经建立的连接进行操作---------------------
	//suspendSendMedia  主要用于暂停发送本地的音频或视频给远端特定端
	// username:远端用户名 
	suspendSendMedia : function(username){
			//有必要时在做添加,暂时没什么用
			this.pc[username].peer.removeMediaStream();
	},
	//end suspendSendMedia
	//-------------主动关闭连接-------
	stop : function(){
		var sendMsg = {
						"from" : this.localUser,
						"type" : "bye",
						"state" : 1,
						"msg" : null,
					};
		   this.sendMs({
						a: 4,
						de : '1',
						ms: sendMsg,
						t: null
					});

   this.closeAllConn();
   //关闭本地媒体
   //
   if (this.localStream !== null) {
   	this.localStream.stop();
   };
   	
	},
	//end stop
	//-----调整声音-----
	// v: number 音量大小
	changeVolume : function(v){
		for(var p in this.pc){
			this.pc[p].remoteMedioDOM.volume = v;
			console.log(this.pc[p].remoteMedioDOM.volume + " " +this.pc[p].remoteMedioDOM + " " + v);
		}
	},
	
	//end changeVolume

//不要写到这里.这是整个类的结尾...........
});


//------------------------------连接类--------------------------------------
var WebRTCCreater = Class.extend({
	//------------------------- 构造函数-------------------------
	// stream ---本地媒体流
	// div ---- 播放媒体的 DOM  {remot: DOM, local: DOM}
	// videoOrAudio  ---媒体流类型{audio: true, video: true}
	// remoteUser ----连接目标
	init : function (stream,div,videoOrAudio,remoteUser){
		this.localStream = stream;
		this.localUser = u.username;
		this.remoteUser = remoteUser;
		this.stun = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
		this.remoteMedioDOM = div.remote;
		this.localVideo = div.local;
		this.peer = null;
		this.videoOrAudio = videoOrAudio;
	},
	//end
	//------------------------  peerConnection 的回调函数-------
	onGettingIceCandidates : function(e){
		/*if (candidate && isLastCandite) {
			this.sendCandidate(candidate,isLastCandite);
				
		}else if (candidate) {
			this.sendCandidate(candidate);
		};*/ //旧版本的
		var msg = null;
		if (e.candidate) {
      			/*sendMessage({type: 'candidate',
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate});*/

                msg = {
                	"label" : e.candidate.sdpMLineIndex,
					"sdp" : e.candidate.candidate,
					"id" : e.candidate.sdpMid
                }
                this.sendCandidate(msg);
    	} else {
      		console.log("End of candidates.");
    	}
		
	},
	// end onGettingIceCandidates
	//---------------------- 发送iceCandidate--------
	sendCandidate : function (msg){

		//var sdp = JSON.stringify(candidate.toSdp());
		/*var candidateMs = {
			"label" : candidate.label,
			"sdp" : sdp,
			"more" : more
			};*/
		//-----------------------------		
		this.sendMsg({
			"from": this.localUser,
			"type": "candidate",
			"state" : 1,
			"msg" : msg
		});
		console.log('send iceCandidate :::' + msg.sdp);
		//-----------------------------/**///旧版本

	},
	//end Candidate
	//--------handleIceCandidate-------
	handleIceCandidate : function(msg){
		if(this.peer != null){
				try{
					var remoteCandidate = new RTCIceCandidate({sdpMLineIndex: msg.label,
  														  		candidate: msg.sdp
  														});
					this.peer.addIceCandidate(remoteCandidate);
					console.log('set IceCandidate with addIceCandidate :::' + msg.sdp );
				}catch(e){
					console.log("Failed to handle iceCandidate:: "+ msg.sdp +"   \nexception: " + e.message);
				}
			
		}else{
			console.log('no peer');
		}
	},
	//end handleIceCandidate--------
	//------发送信息-------------
	sendMsg : function(msg){
		websocketHelper.sendMs(4,this.remoteUser,msg,null);
	},
	//------关闭连接-------
	stop : function(){
		this.peer.close();
		this.peer = null;
		this.remoteUser = null;
		this.remoteMedioDOM = null;
	},
	//end stop
	//-------removeMediaStream
	removeMediaStream : function (){
		if (this.peer!==null) {
			this.peer.removeStream(this.localStream);
		};
	},
	//end removeMediaStream
});

//发起连接 m继承自WebRTCCreater
var WebRTCOffer = WebRTCCreater.extend({
	init : function(stream,div,videoOrAudio,remoteUser){
		this._super(stream,div,videoOrAudio,remoteUser);
		console.log('init offer for::' + remoteUser);
		this.createPeer();
	},

	//-------------------- 创建peer连接----\

	createPeer : function(){
		var self = this;
		if (this.peer === null) {

		 try{
		 	this.peer = new RTCPeerConnection(this.stun);
			this.peer.onicecandidate =function(e){self.onGettingIceCandidates(e);} 
			console.log("new RTCPeerConnection for" + this.remoteUser);
		 }catch(e){
		 	console.log("new RTCPeerConnection for " + this.remoteUser + "failed");
		 }
			

			//this.peer = new PeerConnection(this.stun, function(candidate, isLastCandite){
			//	self.onGettingIceCandidates(candidate, isLastCandite);
			//});




			this.peer.onconnecting = function(){
				console.log("Session connecting.::" + self.remoteUser);
			};
    		this.peer.onopen = function(){
    			console.log("Session opened.::" + self.remoteUser);
    		};
    		this.peer.onaddstream = function(evt){
    			 self.remoteMedioDOM.src = URL.createObjectURL(evt.stream);
    			 console.log('remote  stream add::' + self.remoteUser);
    		};
    		this.peer.onremovestream = function(){
    			console.log("Remote stream removed.::" + self.remoteUser);
    		};
    	this.peer.addStream(this.localStream);
    	this.creatOffer();
    	//handleIceCandidate;
		} else{
			console.log('PeerConnection is alread create');
		};
		
	},
	//end createPeer
	 //-----------创建offer----
	 creatOffer : function(){
	 	var self = this;
	 	var offer = this.peer.createOffer( function(sessionDescription){  //createOffer 三个参数 成功的回调函数,失败的回调函数,音视频的参数 
	 		self.peer.setLocalDescription(sessionDescription); 
	 		self.sendOffer(sessionDescription);	

	 	},null,this.videoOrAudio); //this.videoOrAudio = {audio: true,video: false}
	 	//this.peer.setLocalDescription(this.peer.SDP_OFFER,offer); 
	 	console.log('offer created successfully.');
	 	//this.sendOffer(offer);
	 	//this.peer.startIce();新版本中不需要手动开启ice
	 	console.log('Ice for::'+this.remoteUser + ' successfully');	
	 },
	 //end creatoffer
	 //--------发送offer------------
	 sendOffer : function(offer){
	 	//alert(offer.toSdp());
	 	//var sdp = JSON.stringify(offer.toSdp());//对 sdp 进行两次 stringify .会导致 
	 	//this.peer.setRemoteDescription(this.peer.SDP_OFFER, new window.SessionDescription(msg.sdp));
	 	//异常 DOM Exception 12
	 	var offer = JSON.stringify(offer);
	 	//alert(sdp);
	 	//var offerMs = {         //目的是使 消息的格式相同
	 	//	"sdp":offer.sdp
	 	//};
	 	this.sendMsg ({
	 		"from": this.localUser,
			"type": "offer",
			"state" : 1,
			"msg" : offer
	 	});

	 console.log("sendOffer to " + this.remoteUser + " ::: " /*+ sdp*/);
	 },
	 //end sendOffer
	 //------------------消息处理部分  //留在webRTC类中处理
	/* handleMsg : function(msg){
	 		if (msg.type === 'answer' && this.peer!==null ) {
	 			this.handleAnswer(msg.msg);
	 		} else(msg.type ==='candidate' && this.peer !==null ){
	 			this.handleIceCandidate
	 		}else{
	 			console.log('!!bad msg::' + JSON.stringify(msg));
	 		};
	 },*/
	 //end handleMsg
	 //-------------处理answer -----
	 handleAnswer : function(msg){
	 	var msg = JSON.parse(msg);
	 	//new window.SessionDescription(msg.sdp);
	 	this.peer.setRemoteDescription(new RTCSessionDescription(msg));
	 	console.log('setRemoteDescription :::'/* + msg.sdp */+ 'from' + this.remoteUser);
	 },
	 //end handleAnswer
});


var WebRTCAnswer = WebRTCCreater.extend({
	init : function(stream,div,videoOrAudio,remoteUser){
		 this._super(stream,div,videoOrAudio,remoteUser);
		 console.log('init answer for ' + remoteUser);
		this.createPeer();
	},

	//-------------------- 创建peer连接----\

	createPeer : function(){
		var self = this;
		if (this.peer === null) {

			 try{
		 	this.peer = new RTCPeerConnection(this.stun);
			this.peer.onicecandidate =function(e){self.onGettingIceCandidates(e);} 
			console.log("new RTCPeerConnection for" + this.remoteUser);
			}catch(e){
		 	console.log("new RTCPeerConnection for " + this.remoteUser + "failed");
		 }
			

			//this.peer = new PeerConnection(this.stun, function(candidate, isLastCandite){
			//	self.onGettingIceCandidates(candidate, isLastCandite);
			//});



			this.peer.onconnecting = function(){
				console.log("Session connecting.::" + self.remoteUser);
			};
    		this.peer.onopen = function(){
    			console.log("Session opened.::" + self.remoteUser);
    		};
    		this.peer.onaddstream = function(evt){
    			 self.remoteMedioDOM.src = URL.createObjectURL(evt.stream);
    			 console.log('remote  stream add::' + self.remoteUser);
    		};
    		this.peer.onremovestream = function(){
    			console.log("Remote stream removed.::" + self.remoteUser);
    		};

    	//this.addStream(this.localStream); ///z在creatAnswer中执行
    	//this.creatAnswer();
    	//handleIceCandidate;
		} else{
			console.log('PeerConnection is alread create');
		};
		
	},
	//end createPeer
	//--------- 处理offer,创建answer-----
	handleOffer : function(msg){
		if (this.peer !== null) {
			var msg = JSON.parse(msg);
			//alert(msg);
			this.peer.setRemoteDescription(new RTCSessionDescription(msg));
			console.log('setRemoteDescription for' + this.remoteUser);
			this.peer.addStream(this.localStream);
			this.createAnswer();
		}else{
			console.log('peer is not create');
			this.createPeer();
			this.handleOffer(msg);
		};
	},
	//end hanleOffer
	//------创建answer-------
	createAnswer : function(){
		//旧接口
		//var answer = this.peer.createAnswer(this.peer.remoteDescription.toSdp(),this.videoOrAudio); //videoOrAudio = {audio:true, video: false}
		//this.peer.setLocalDescription(this.peer.SDP_ANSWER, answer);
		 console.log(' answer created successfully.:: for ' + this.remoteUser);
		 
		 //this.sendAnswer(answer);
		 var self = this;
		 this.peer.createAnswer(function(sessionDescription){
		 	self.peer.setLocalDescription(sessionDescription);
		 	self.sendAnswer(sessionDescription);
		 },null,this.videoOrAudio); // 三个参数 , 前两个成功和失败的回调,第三个 媒体流的配置
		 //this.peer.startIce();新版本中不需要手动开启ice
		 console.log('Ice start for::'+this.remoteUser + ' successfully')
	},
	//end createAnswer
	//----- 发送Answer----
	sendAnswer : function(answer){
		var answer = JSON.stringify(answer);
		//var sdp = answer.sdp;
		//var answerMs = {
		//	"sdp" : sdp,
		//};
		this.sendMsg({
			"from": this.localUser,
			"type": "answer",
			"state" : 1,
			"msg" : answer
		});
		console.log('sendAnswer to ' + this.remoteUser + "::" /*+ sdp*/);
	},//end sendAnswer
	
});
