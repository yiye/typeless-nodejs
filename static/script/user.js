 // 除绘图之外的，通过ajax与服务器通讯的代码。
 // 处理登陆、加入房间、好友管理、房间信息/好友信息 的更新（用worker）

/* 全局变量 */
var u={};//全局变量管理器 ,只用于此文件
u.add=function(str){
var arr=str.split("."),s=u;
for(i=(arr[0]=="GlOBAL")?1:0;i<arr.length;i++){
    s[arr[i]]=s[arr[i]]||{};
    s=s[arr[i]];
    }
}
u.add("username"); // 用户名
u.username = null;
//u.add("nickname");
//u.add("email");
u.add("islogin"); // true / false
u.add("room");    // 房间号
u.add("room_password");
u.add("owner");     //房主
u.add("paint_mode");//模式 free | only
u.add("painter");   //执笔者
u.room = 0;
u.owner         = null;
u.painter       = null;
u.paint_mode    = null;
u.room_password = null;
u.add("members");   //成员表 ，格式待定
u.add("ws_port");
u.ws_port = '8889'  ;
var roomTime;

function User(){}

User.prototype = {
    roomTime : null,
    post: function(act, data, callback){
        $.post("/ajax",{"state":"0","act":act,"data":JSON.stringify(data)},callback);
    },

    //-----------------------------user status function
    login:function(name, hashed_pw){
        //TODO : 输入内容验证
        //显示错误信息 or 登陆成功
        var self = this;
        // 发送注册消息
        var data = {"username":name,"hashed_pw":hashed_pw,"email":" "};
        self.post("login",data,self.loginMsgProcessor);
    },
    islogin: function(){
    var self = this;
    $.post("/ajax",{"state":"0","act":"islogin","data":" "},function(msg){
        msg = JSON.parse(msg);
        if(msg.state == 1){
            console.log("login OK.");
            finishedIsLogin();
            u.username = msg.data.username;
            u.email = msg.data.email;
            u.islogin = true;
            self.friend_info();
            setTimeout(function(){self.fetch_msg(); self.friend_info();},1000); 
            if(msg.data.room != undefined)
            {
                // 若用户已经在某个房间内了，这说明刚刚可能是掉线。
                u.room = msg.data.room;
                self.post("room_info",{},function(res){
                    // 更新房间信息 (不包括好友列表)
                    var room_msg = JSON.parse(res);
                    console.log("in islogin : "+res);
                    u.room          = room_msg.data.room_number;
                    u.owner         = room_msg.data.owner;
                    u.painter       = room_msg.data.painter;
                    u.paint_mode    = room_msg.data.paint_mode;
                    u.room_password = room_msg.data.room_password;
                });
                $("#span_room_num").html("#" + u.room);
            }
            else
            {
                u.room = 0;
                changeRoomnum();
            }
        }
        else
        {
            notIslogin();
            u.islogin = false;
            console.log("user not login now");
        }
    });
    return u.islogin;
    },

    loginMsgProcessor : function(msg){
        console.log("LOG:" + msg);
        var msg = JSON.parse(msg);
        if(msg.state == 1){
            console.log("LOG:"+"login OK.");
            
            
            u.username = msg.data.username;
            u.email = msg.data.email;
            u.islogin = true;
            loginMSGdom();
            window.location = "#x"; // go back to the drawing board
            GLOBAL.user.friend_info();
            setTimeout(function(){GLOBAL.user.fetch_msg(); GLOBAL.user.friend_info();}, 1000);

        }
        else{
            notloginMSGdom();
            u.islogin = false;
            console.log("LOG:"+"user not login now");
        }
    },
    register: function( name, pw , email){
        var self = this;
        self.post("register",{"username":name,"hashed_pw":pw,"email":email},function(res){
            var msg = JSON.parse(res);
            console.log(msg);
            
            if(msg.state == 1){ 
                console.log("register OK"); 
                /* if register ok, try login as this account */
                send_data = {"username":name,"hashed_pw":pw,"email":" "}
                console.log(send_data);
                self.post("login",send_data,self.loginMsgProcessor);
           menuHideAll();// go back to the drawing board
            }
            else
            {
                //TODO
                self.pretty_alert(msg);
                console.log(res);
            }
        });
    },
    logout: function(){
        var self = this;
        var r = confirm("真的要注销吗亲？如果您正在房间内，注销将使您离开房间。");
        if(r==true)
        {
            self.post("logout",{},function (){});
            u.islogin = false;

            // TODO:
            // 退出房间(发logout 消息。)，关闭websocket等等。

            self.post("leave_room",{},function(){});
            menuHideAll();
            

            // TODO : stop room info update worker 
            //关闭语音
            if (GLOBAL.webRTC) {
                GLOBAL.webRTC.stop();
                delete GLOBAL.webRTC;
            };
            // 关闭websocket,注销worker
            if (u.room != 0 ) {
                websocketHelper.closeConn();
                u.room = 0;
                u.owner         = null;
                u.painter       = null;
                u.paint_mode    = null;
                u.room_password = null; 
            
            };
            // 其他清理工作 
            u.username = null;
            //UI清理
            logout_UI();



            menuHideAll();
        }
    },
    //----------------------User's action-------------------------------
    createRoom: function(pw){
        var self = this;
        self.post("create_room",{"password":pw,"mode":"free"},function(res){
            console.log("LOG:"+res);
            var msg = JSON.parse(res);
            console.log("LOG:" + msg.state + " , "+msg.data.room_number);
            self.islogin();// update data
            if (msg.state == 1){
                menuHideAll();
                //alert(u.ws_port);
                var addr = "ws://"+window.location.hostname+":"+ u.ws_port +"/room/"+msg.data.room_number+"/ws";
                // TODO : start workers
                // TODO : start websocket
                //alert(addr);
                // TODO : clean canvas
                //建立ｗｅｂ ｓｏｃｋｅｔ链接
                websocketHelper.init(u.username,addr,GLOBAL.flowChart,GLOBAL.draw,GLOBAL.wordChat,GLOBAL.system);
                /*self.post("room_info",{},function(res){
                    // 更新房间信息 (不包括好友列表)
                   // alert(res);
                    var room_msg = JSON.parse(res);
                    u.room          = room_msg.data.room_number;
                    u.owner         = room_msg.data.owner;
                    u.painter       = room_msg.data.painter;
                    u.paint_mode    = room_msg.data.paint_mode;
                    u.room_password = room_msg.data.room_password;
                    //alert(room_msg.data.owner);
                    alert(u.owner);

                    


                });*/
                
                self.roomTime = setInterval(function(){self.room_info();}, 1000);
                joinroom_UI();
            }
            else{
                u.room = 0;
                self.pretty_alert(msg);
                console.log("LOG:"+res);
            }
        });
    },
    leaveRoom: function(){
        var self = this;
            // TODO:　tell all the people via　websocket
            // 断开webRTC
            if (GLOBAL.webRTC) {
                GLOBAL.webRTC.stop();
                delete GLOBAL.webRTC;
            };
            self.post("leave_room",{},function(){});
            //将房间信息设置成默认值
            u.room = 0;
            u.owner         = null;
            u.painter       = null;
            u.paint_mode    = null;
            u.room_password = null;
            hanleaveRoom();
            leaveroom_UI();
            clearInterval(self.roomTime);
            self.roomTime = null;
            // TODO : stop room info update worker 
            //关闭语音
            $("#span_room_num").html(u.username);
            // 关闭websocket,注销worker
            websocketHelper.closeConn(); 
     },
    enterRoom:function(number, pw){
        var self = this;
        self.post("enter_room",{"room_number":number,"password":pw},function(res){
            var msg = JSON.parse(res);
            console.log(res);
            if(msg.state == 1)
            {
                // OK
                self.islogin();
                console.log("msg.data.room_number ="+msg.data.room_number);
                menuHideAll();
                console.log("u.room = "+u.room);
                // TODO start worker and websocket ...
                var addr = "ws://"+window.location.hostname+":"+ u.ws_port +"/room/"+ msg.data.room_number +"/ws";
                console.log("connect addr = "+addr);
                websocketHelper.init(u.username,addr,GLOBAL.flowChart,GLOBAL.draw,GLOBAL.wordChat,null);
                //alert(JSON.stringify(u.owner));
                //更新 房间信息
                 self.post("room_info",{},function(res){
                    // 更新房间信息 (不包括好友列表)
                    // alert(res);
                    var room_msg = JSON.parse(res);
                    u.room          = room_msg.data.room_number;
                    u.owner         = room_msg.data.owner;
                    u.painter       = room_msg.data.painter;
                    u.paint_mode    = room_msg.data.paint_mode;
                    u.room_password = room_msg.data.room_password;
                    //alert(room_msg.data.owner);
                    //alert(u.owner);
                    //清空本地流程
                    //图
                    GLOBAL.flowChart.msReset();
                    //清空本地画图
                    GLOBAL.draw.msReset();
                    //请求房主的流程图
                    GLOBAL.flowChart.queryFC(u.username,u.owner);



                });
                self.roomTime = setInterval(function(){self.room_info();}, 1000);
                joinroom_UI(); 
            }
            else
            {
                self.pretty_alert(msg);
            }
        });
    },

    roomSetting:function(new_pw, new_mode){
        var self = this;
        self.post("password_change",{"password":new_pw},function(res){
            var msg = JSON.parse(res);
            if(msg.state == 1){
                u.paint_mode = new_mode;
                menuHideAll();
            }
            else{
                self.pretty_alert(msg);
            }
        });
        self.islogin();
    },
    modify_profile:function(s_data, type){
        var self = this;
        self.post("modify_profile",s_data, function(res){
          self.Tip(res);
        });
    },
    fetch_msg:function(){
        var self = this;
        self.post("fetch_msg",{"howmany":"1"}, function(res){
          //console.log("LOG:" + res);
          var res = JSON.parse(res);
          if(res.state == 1){
              if( res.data.msg[0] != undefined && res.data.msg[0].type == 'add_friend') set_msg(res.data.msg[0]);
              else if(res.data.msg[0] != undefined && res.data.msg[0].type == 'invite') set_msg(res.data.msg[0]);
              var ajfetch =  setTimeout(function(){self.fetch_msg(); self.friend_info();}, 1000);
          }
          else{
              console.log("LOG:"+"获取失败.");
          }
        }); 
    },
    invite:function(msg){
        var self = this;
        self.post("invite",{"who":msg, "words":"来吧！"}, function(res){
          console.log("LOG:"+res);
        });
    },
    kick:function(msg){
        var self = this;
        self.post("kick", {"user":msg}, function(res){
          console.log("LOG:"+res);
        });

    },
    set_friend:function(type, id){
        var self = this;
        if(type == 'new_user'){
	  self.post("search_user", {'keyword':id},function(res){
	  res=JSON.parse(res);
	  if(res.state == 1){
          	self.post("set_friend", {'new_user':[id]}, function(res){
            		console.log("LOG:"+res);
	    		res = JSON.parse(res);
            		if(res.state == 1){
              			menuHideAll();
            		}
            		else{
              			createTip("添加失败。");
            		}
          	});
	}
	else{
	      createTip('添加失败.');	
	}
})
        }
        else if(type == 'del_user'){
          self.post("set_friend", {'del_user':[id]}, function(res){
            console.log("LOG:"+res);
          });
        }
    },
    confirm:function(msg){
        var self = this;
        if(msg.type == 'add_friend'){
          self.post("set_friend",{"confirm_user":[msg.from]}, function(res){
            console.log("LOG:" + res);
          });
        }
        else if(msg.type == 'invite'){
          self.enterRoom(msg.content.room,"",function(){
            hanRoommember();
          });
        }
      },
    friend_info:function(){
        var self = this;
        self.post("friend_info", {}, function(res){
          //console.log("LOG:" + res);
          var res = JSON.parse(res);
          hanFriend(res);
        });
    },
    room_info:function(){
        var self = this;
        self.post("room_info", {'what':['members']}, function(res){
          //console.log("LOG:" + res);
        var res = JSON.parse(res);
        if(res.state == 1)  hanRoommember(res);
        else {
            //copy to here
            // TODO:　tell all the people via　websocket
            // 断开webRTC
                    if (GLOBAL.webRTC) {
                        GLOBAL.webRTC.stop();
                        delete GLOBAL.webRTC;
                    };
                    self.post("leave_room",{},function(){});
                    //将房间信息设置成默认值
                    u.room = 0;
                    u.owner         = null;
                    u.painter       = null;
                    u.paint_mode    = null;
                    u.room_password = null;
                    hanleaveRoom();
                    clearInterval(self.roomTime);
                    // TODO : stop room info update worker 
                    //关闭语音
                    $("#span_room_num").html(u.username);
                    // 关闭websocket,注销worker
                    websocketHelper.closeConn(); 
                }
        });
    },
     //---------------------action
    pretty_alert: function(msg){
        alert("啊哦～，出错了。错误的原因可能是: "+msg.data.why);
    },
    Tip:function(msg){
        console.log("LOG:" + msg);
        var msg = JSON.parse(msg);
        if(msg.state == 1){
            console.log("LOG:"+"modify OK.");
            createTip("修改成功");
            window.location = "#x"; // go back to the drawing board
        }
        else{
            createTip("修改失败");
            console.log("LOG:"+"modify error");
        }
    }
}


//-------------------用户的刷新操作------------------------------
//-------------------刷新前的处理------------------------
    
window.onbeforeunload=function(){
    //console.log('0');
    var tishi = '';
    if (u.room != 0) {
        //通知关闭rtc
         if (GLOBAL.webRTC) {
                GLOBAL.webRTC.stop();
                delete GLOBAL.webRTC;
                tishi = '您点了刷新或者关闭按钮,导致语音断开\n';
        };
        //console.log('1');

       return tishi + "继续的话会离开房间";
        //console.log('2');
    };
    
};
