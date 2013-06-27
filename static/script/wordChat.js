/**
 * @author yiye
 */
//注意: 本类依赖jquery
function WordChat(msBox,inBox,sureBtn){
	
		this.msBox = $('#'+ msBox);
        this.inBox = $('#'+ inBox);
        this.sureBtn = $('#' + sureBtn);
        this.msCount = 0;
	    
	if((this.msBox.attr('id') != undefined)&&(this.inBox.attr('id') != undefined)&&(this.sureBtn.attr('id') != undefined)){
		this.init();
	}else{
			alert('WordChat init error , msBox,inBox  sureBtn can not be get')
		}
				
          
}
WordChat.prototype = { 
	//---------- 初始化---------
	init : function(){
	    var self = this;
		this.msCount = 0;
		//this.clear();
		this.sureBtn.click(function(){
			self.getMs();
		});
                    this.inBox.keyup(function(){
                        if(event.keyCode == '13'){
                            self.getMs();
                        }
                    });

	},
	//ｅｎｄ
	//-------获取输入消息--------
	getMs : function(){
		
	//	if(self == 'undefinded'){
		var self = this;
		//}
	 var txt = self.inBox.val();
	      self.inBox.val('');
	     // alert(self.inBox.attr('id'));
	/// alert(txt);
	 var today=new Date()
	 var h=today.getHours()
	 var m=today.getMinutes()
	 var s=today.getSeconds()
	 
	 var time = h+":"+m+":"+s;
	 
	 
	 /*var html ="<section class='every_mes'><div id='aim_head'><label>我：</label></div><section id='include'>"+txt+"</section><span>"+time+"</span></section>"
	 if(self.msCount < 20){
	 	self.msBox.append(html);
	 	//alert(self.msCount);
	 }else {
	    // alert(self.msBox.children('section:first').text());
	 	self.msBox.children('section:first').remove().end().append(html);
	 	//self.msBox.append(html);
	 }*/
	self.msHander({a:3,n:u.username,d:'1',ms:txt,t:time});
	if(u.room != 0){
	    //alert(u.room);
	    websocketHelper.sendMs(3,'1',txt,time);
	}
	//self.msCount ++;
		
	},
	//ｅｎｄ
	//------显示输入消息---------
	msHander: function(ms){
	    var html ="<section class='every_mes'><div class='aim_head'><label>"+ms.n +"</label><span>"+ms.t+"</span></div><section class='include'><pre></pre></section></section>"
         if(this.msCount <20){
             this.msBox.append(html);
             //alert(self.msCount);
        }else {
             // alert(self.msBox.children('section:first').text());
             /*this.msBox.children('br:first').remove();*/
             this.msBox.children('section:first').remove().end().append(html);
            //self.msBox.append(html);
         }
         var divPre = this.msBox.children('section:last').find('pre');
		 divPre.text(ms.ms);
		 //alert(divPre.css('width'));
		 //聊天Pre标签的显示方法
		 if(parseInt(divPre.css('width')) > 250){
			 divPre.css('display','block');
			 }
		//区别字和别人的名字的颜色
		 if(ms.n === u.username){
			  this.msBox.children('section:last').find('.aim_head').css('color','#EEB552');
			 }
         //alert(this.msBox[0].scrollHeight);
         //让聊天框 自动到底部
         this.msBox.scrollTop(this.msBox[0].scrollHeight);
         this.msCount ++;
         var inter = 200;
         $("#header_hide").fadeOut(inter).fadeIn(inter).fadeOut(inter).fadeIn(inter).fadeOut(inter).fadeIn(inter);
	}
	//end
	//------清空消息------------
}//end prototype 
