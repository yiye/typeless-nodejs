// JavaScript Document
//
//最终消息格式:
//  { a:  1: 发送 draw 的消息 2: 发送 flowChart 的消息  3:chart 聊天消息 4.webRTC消息 5: 建立连接 6: 修改连接 7.断开连接
//    n:  发送者姓名
//	  u:  发送者的url
//	  d:  发送的对象 如果为 "1"则为所有人 . 具体时则为发送对象的名称
//	  ms: 消息
//   }

;(function(){
	
	window.websocketHelper ={
				w: null, //执行websocke的 worker
				f: null, //flowChart 对象
				d: null, //draw 对象
				c: null, //chat对象
				s: null, //webRTC 对象
				na: 'O(∩_∩)O',//当前 websocket 拥有者
			//-----------------------------初始化websocket---------------
			//参数说明:
			//name: 当前用户名
 			//url :建立 websocket的url
			//fc: flowChart 对象
			//dr : draw duix
			//ch : chat 对象
			//sy : sys 对象
			init: function(name,url ,fc,dr,ch,rtc){
				this.w = new Worker('/static/script/worker/websocket.js');
				this.f = fc;
				this.d = dr;
				this.c = ch;
				this.r = rtc; // 一般初始化时并不给 webRTC' 赋值,只有在建立webRTC时才
				this.na = name;
				this.w.postMessage({a:5,u:url,n:name}); //将 n: 修改为姓名当前用户名
				var self = this;
				this.w.onmessage = function(e){
                    var a = e.data.a;
                         switch(a){
                          case 1: self.d.msHander(e.data);break;
                          case 3: self.c.msHander(e.data);break;
                          case 2: self.f.msHander(e.data.ms);break;
                          //alert('f');
                          
                          case 4: 
                          //alert();
                          if (self.r!==null) {
                          	self.r.msHander(e.data);
                          };
                          break;
                          case 8:
                          	//alert('ms');
                           console.log(e.data.ms);
                          break;

                     }
                    
                    //alert(self);
                    //alert(' get ms');
                   // console.log(JSON.stringify(e.data));
                    //console.log('receive ms come from ' +  e.data.n + ' to ' + e.data.d);
                // alert(e.data);
                }// end msHander()
				//var s = new WebSocket('ws://127.0.0.1:1234/ws');
				 //s.onopen = function(e){
					// alert('good');
					 //}
				 
				},//end init()
		///-----------------------------建立新连接------------------------
			//setUpConn : function(url){
		//		
			//	},// end Conn() 
		//-----------------------------关闭连接---------------------------
			changeConn : function(url){
				this.w.postMessage({a:6,u: url});
				},// end Conn()
		//---------------------------关闭连接-----------------------------
			closeConn : function(){
				this.w.postMessage({a:7});
				this.w.terminate();
				},// end closeConn()
		// -------------------------发送消息------------------------------
		//a: type 消息类型 1 ,2,3 ,4
		//n: 发送者姓名
		//de: 发送目标   字符'1'为 所有人
		//m: 消息
		//t: 时间	
		    sendMs : function(a,de,m,t){
				this.w.postMessage({a:a,n:this.na,d:de,ms:m,t:t});
				},//end sendMs
				
				
		}//end web socket Helper()
	
	
	
	
	})();