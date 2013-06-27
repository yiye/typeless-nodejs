//ajax消息格式
//worker 返回的消息为 ajax 返回的完整消息状态 如:
//{"state": "1", "data": {"username": "a", "email": " ", "online": "1"}, "act": "islogin"}






;(function(){
    window.ajaxHelper = {
         w: null,//worker对象
         h: null,// hashtable 对象
         //-----------------------------初始化----------------
         
         init: function(){
           var self = this;
            this.w = new Worker('/static/script/worker/ajax.js');
            
            //-------------worker消息处理函数---------------
            this.w.onmessage = function(e){
                var ms = e.data;
                 console.log(e.data.act);
               var msH = self.h.get(ms.act);//根据hash表 获取相应的处理函数
                if(msH != null){
                 msH(ms);//消息处理函数 参数是 ajax返回值的全部
                }
               },//end msHande
               
               
            this.h = new Hashtable();
            var  hashtest = function() {
                console.log('hash test');
               }
            this.h.put('islogin',hashtest);
            this.h.put('login',user.loginMsgProcessor);
            this.h.put('logout',hashtest);
            this.h.put('modify_profile',hashtest);
            this.h.put('register',hashtest);
            this.h.put('set_friend',hashtest);
            this.h.put('room_info',hashtest);
            this.h.put('friend_info',hashtest);
            //this.h.put('fetch_msg',hashtest);
            //this.h.put('search_user',hashtest);
            //this.h.put('creat_room',hashtest);
            //this.h.put('enter_room',hashtest);
            //this.h.put('password_change',hashtest);
            //this.h.put('leave_room',hashtest);
            //this.h.put('owner_change',hashtest);
            //this.h.put('paint_mode_change',hashtest);
            //this.h.put('invite',hashtest);
            this.h.put('kick',hashtest);
            this.h.put('ajax_erro',hashtest);
           
         },//end init()
         //-------------------------消息处理函数---------------
         //msHander: function(e){
           // var ms = e.data;
            //var msH = this.h.get(ms.act);//根据hash表 获取相应的处理函数
           // if(msH != null){
             //  msH(ms.data);//消息处理函数 参数是 ajax返回值的data 部分
            //}
         //},//end msHander
         //------------------------发送消息-------------------
         //------------------------参数应该为完整的 ajax 请求消息部分
         //-如-{"state":"0","act":"login","data":'{"username":"debug","hashed_pw":"123456"}'}--------
         msSend : function(ms){  
            this.w.postMessage(ms);
         }
         //end msSend
        }
})()
