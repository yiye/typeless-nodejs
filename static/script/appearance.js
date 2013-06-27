 //LOG: 避免混淆  logout--->logout_UI

var objA = 0; 
var nowRoom = 0;
var nowOnfriend = 0;
var nowOfffriend = 0;
var a = {};
a.add = function(str){
    var arr = str.split("."), s = a;
    for(i = (arr[0]=="GLOBAL")?1:0;i<arr.length;i++){
        s[arr[i]] = s[arr[i]] || {};
        s = s[arr[i]];
    }
}
a.add("friendCurrentlySelected");
a.add("memberCurrentlySelected");
var isloginOk = false;
//-------------------style about the page --------------------------------------------
//重写alert()函数
window.alert=function (txt){

    window.location = "#warn_mess";
    $('#warm_msg').html(txt);
}
//重写 confirm ()函数
// window.confirm = function (txt){
//     window.location = "#confirm_mess";
//     $('#confirm_msg').html(txt);
    
//     return false;
// }

var menuHideAll =function(){
    $(".user_M").slideUp(0);
    window.location = "#x";
    }
var    menuShow =function(){
    $("#menu_id").slideDown(0);
    }
var    menuRoomToggle = function(){
    if(u.room > 0){
        if(u.owner == u.username){
           $("#menu_room_owner").slideToggle(0);
        }
         else {
           $("#menu_room_in").slideToggle(0);
        }
   }
    else {
        $("#menu_room_out").slideToggle(0);
    }
}
var finishedIsLogin = function(){
    $("#div_loginbar").hide("fast");
    $("#div_userinfobar").show("fast");
}
var changeRoomnum = function(){
    $("#span_room_num").html(u.username);
}
var notIslogin = function(){
    $("#div_loginbar").show("fast");
    $("#div_userinfobar").hide("fast");
}
var loginMSGdom = function(){
    $("#div_loginbar").hide("fast");
    $("#div_userinfobar").show("fast");
    $('.tipMessage').remove();
     $("#span_room_num").html(u.username);
    menuHideAll();
}
var notloginMSGdom = function(){
    $('.sl_shape').after(createTip('用户名密码错误'));
    $("#div_loginbar").show("fast");
    $("#div_userinfobar").hide("fast");
}
var logout_UI = function(){
    $("#div_loginbar").show("fast");
    $("#div_userinfobar").hide("fast");
    $("#friends_detail").html("");
    $('#onlineFriends').html("");
    $(".rm_num>span").html("");
    $("#list_members").html("");
    nowRoom = 0;
    nowOnfriend = 0;
    nowOfffriend = 0;
}

var joinroom_UI = function(){
    $(".f_down").slideUp(250, function(){
        $(".roommember").slideDown();
        $("#f_list, #f_list+span").show();
        $("#r_meb_icon, #r_meb_icon+span").hide();
      });
}

var leaveroom_UI = function(){

   $(".roommember").slideUp(250,function(){
        $(".f_down").slideDown();
        $("#r_meb_icon, #r_meb_icon+span").show();
        $("#f_list, #f_list+span").hide();
      });//显示好友列表
    //清空房间成员
    //hanleaveRoom()
}
var set_my_color = function(hex,rgb){
        // 设置 UI上的某些颜色、全局变量中，我选中的颜色
        
        $('.c_change').css('backgroundColor', '#' + hex);
        //$('#c_now_a').css('backgroundColor', '#' + hex);
        // TODO : 设置全局变量中的颜色
        GLOBAL.color = rgb;
        //alert(rgb);
}
var set_msg = function(msg){
  var self;
  $('<li data-content=\"'+msg.title+'\"> from :'+msg.from+'</li>').click(function(){
    self = $(this);
    $('.decide').remove();
    $('.mes_inc').html($(this).attr('data-content'));
    $('<div class=\"decide\" style=\"width:465px; text-align:right;\"><div>').insertAfter('.mes_inc'); 
    $('<input type=\"button\" value=\"接受\">').appendTo('.decide').click(function(){
      GLOBAL.user.confirm(msg);
      $('.mes_inc').html("");
      self.remove();
      if($('.mes_tit>li').length == 1){
        $('#btn_msg').css("background-color", "#2587DA");
        }
    });
    $('<input type=\"button\" value=\"不要\">').appendTo('.decide').click(function(){
      $('.mes_inc').html("");
      self.remove();
      if($('.mes_tit>li').length == 1){
        $('#btn_msg').css("background-color", "#2587DA");
      }
    }); 
  }).appendTo('.mes_tit');
  $('#btn_msg').css("background-color", "#EEB552");
}
var createTip = function(text){
    if($('.tipMessage')[0] != undefined ){
        $('.tipMessage').html('<p>' + text + '</p>');
    }
    else{
        return $('<div class="tipMessage"><p>' + text + '</p></div>');
    }
}
var hanFriend = function(msg){
    if(msg.data.on.length != nowOnfriend || msg.data.off.length != nowOfffriend){
        $('#onlineFriends').html(msg.data.on.length + "/" + (msg.data.on.length + msg.data.off.length));
        $("#friends_detail").html("");
        nowOnfriend = msg.data.on.length;
        for(var i = 0; i < msg.data.on.length;i++){
          $("#friends_detail").append("<div style=\"border:3px solid #EEB552\"  id=\"fm_" + (i+1) + "\"></div>\
                                      <span>"+msg.data.on[i]+"</span>");
                          }
        nowOfffriend = msg.data.off.length;
        for(var i = 0; i < msg.data.off.length;i++){
            $("#friends_detail").append("<div  id=\"fm_" + (i+1) + "\"></div>\
                                        <span>"+msg.data.off[i]+"</span>");
                                  }
    }
}
var hanRoommember = function(msg){
    if(msg.data.members.length != nowRoom){ 
      hanleaveRoom();
      $(".rm_num").append("<span>("+msg.data.members.length+")</span>");
      for(var i = 0; i < msg.data.members.length;i++){
          $("#list_members").append("<div id=\"rm_" + (i+1) +"\"></div><span>"+ msg.data.members[i] +"</span>");
          if(msg.data.members[i] == msg.data.owner)$("#rm_"+(i+1)).css("border", "4px solid #EEB552");
        }
        nowRoom = msg.data.members.length;
    }
    //console.log('room_msg');
}
var hanleaveRoom = function(){
    $(".rm_num>span").html("");
    $("#list_members").html("");
    nowRoom = 0;
}
$(function(){
    //----------------------------style part--------------------------------//
    /*hide necessary*/
    $("#menu_user").hide(); 
    $("#color_picker").hide();
    // line width
    $("#pp_adjust").change(function(){
        var width = $("#pp_adjust").val();
        GLOBAL.lineWidth = width;
        var h = $("#p_width").css({"height":width,"top":40.5-width/2});
    });
    //responsive 
    window.onresize = function(){
      $('div.roommember').css("height", document.documentElement.clientHeight - 46 - 41 - 11 + "px");
      $('div.rm_up').css("height", document.documentElement.clientHeight - 46 - 41 - 11 + "px");
      $('div#list_friends').css("height", document.documentElement.clientHeight - 46 - 20 + "px");
    }
    window.onresize();
    // color picker
    $("#color_picker").ColorPicker({
        flat: true,
        color: '#00ff00',
        onSubmit: function(hsb, hex, rgb) {
          var rgbStr = 'rgb(' + rgb.r +','+ rgb.g +',' + rgb.b + ')';
            set_my_color(hex,rgbStr);
        },
        onChange: function (hsb, hex, rgb) {
            var rgbStr = 'rgb(' + rgb.r +','+ rgb.g +',' + rgb.b + ')';
            set_my_color(hex,rgbStr);
        }
    });
    // toggle colorpicker 
    $('#c_allcolor').bind('click',function(){
        $('#color_picker').slideToggle("fast");
        menuHideAll();
    });
    // 颜色选择 : 先设定其background 为 它的 cid 属性，然后添加点击事件
    $.each(['#c_1','#c_2','#c_3','#c_4','#c_5'],function(i,item){
        $(item).css({"background":$(item).attr("cid")});
        $(item).click(function(){
            console.log(item);
            set_my_color($(item).attr("cid").substring(1,10),$(item).attr("crgb"));
        });
    });
    // toggle user setting menu
    $("#btn_profile").click(function(){
        $("#menu_user").slideToggle(0);
    });
    //$("#")

    $("#menu_members").hide(); // hide at first
    $("#menu_room_members").hide();
    $("#r_meb_icon, #r_meb_icon+span").hide();

    /* 先显示好友列表 @dawn */
    $(".roommember").slideUp(250,function(){
        $(".f_down").slideDown();
        $("#r_meb_icon, #r_meb_icon+span").show();
        $("#f_list, #f_list+span").hide();
    });

    /* 各种好友列表 */
    /*好友列表*/
    $("#f_list, #f_list+span").click(function(){
      $(".roommember").slideUp(250,function(){
        $(".f_down").slideDown();
        $("#r_meb_icon, #r_meb_icon+span").show();
        $("#f_list, #f_list+span").hide();
      });
    });
    $("#r_meb_icon, #r_meb_icon+span").click(function(){
      $(".f_down").slideUp(250, function(){
        $(".roommember").slideDown();
        $("#f_list, #f_list+span").show();
        $("#r_meb_icon, #r_meb_icon+span").hide();
      });
    });
        /*使拉开*/
    /*聊天栏*/
        /*使拉开*/
    $("article.talk_bef").click(function(){
        menuHideAll();
        function chat_header_color (color)
        {
            // change header color of chat box.
            //#EEB552 橙色 , #2587DA 蓝色
            $("#header_lf,#header_rt").css({"border-bottom":"solid "+color+" 30px"});
            $("#header_ct").css({"background-color":color});
        };
        chat_header_color("2587DA");// 变回蓝色，在apperance.js中设定。

        $("article.talk_bef").slideToggle("fast");
        $("article.talk_aft").slideToggle("fast");
        });
        /*使收起*/
    $(".talk_aft header").click(function(){
        menuHideAll();
        $("article.talk_aft").slideToggle("fast");
        $("article.talk_bef").slideToggle("fast");
        });
    /*工具栏*/
        /* 语音工具*/
            /*展开*/
            $(".mike_bef").click(function(){
                if (u.room != 0) {
                    menuHideAll();
                    //alert($(this));
                    $(this).hide('fast');
                    $(".mike").show('fast');

                }else{
                    var ts = '';
                    if (u.username === null) {
                        ts = '请登录后,';
                    };
                    alert(ts+'加入房间使用此功能.O(∩_∩)O~');
                };
                
            });
        /*收起*/
          $(".mike .rp").click(function(){
            menuHideAll();
            $(".mike").hide('fast');
            $(".mike_bef").show('fast');
          });

       /*开启语音*/
          $("#mike_ctr").click(function(){
            //alert('');

            //检测是否用户要关闭语音
            if (($("#mike_ctr").attr("title"))==="关闭语音") {

                    if ( GLOBAL.webRTC) {
                        //关闭webrtc
                        GLOBAL.webRTC.stop();
                        delete GLOBAL.webRTC;
                    };
                //修改图标显示
                 $(".mike_close").css("background","url(../static/img/icon_tool.png) -105px -90px no-repeat");
                  $("#mike_ctr").css("background","url(../static/img/icon_tool.png) -140px -90px no-repeat").attr("title","开启语音");
                 //不处理 4 号消息
                 websocketHelper.r = null;
                 //取消音量调整绑定事件
                 $("#rg_volume").unbind("change");
                 return;
             };



                //检测用户是否是否打开peerConnection
                if ((!window.RTCPeerConnection)&&(!window.webkitRTCPeerConnection)/*||(window.webkitPeerConnection00)不再兼容不稳定版本*/) {
                     // $("body").append();
                    alert("对不起,你的浏览器不支持webRTC,请下载支持webrtc的浏览器");
                    return ;
                };
                // 检测用户是否在房间里
            


                if(u.username !==null&& u.room!==0){
                    //开启语音功能
                    GLOBAL.namespace('webRTC');
                    var dom = document.getElementById('rtc');
                    GLOBAL.webRTC = new WebRTC(dom);
                    websocketHelper.r = GLOBAL.webRTC;

                //修改显示的图图标
             $(".mike_close").css("background","url(../static/img/icon_tool.png) -140px -90px no-repeat");
            // $(".mike_close")
             $("#mike_ctr").css("background","url(../static/img/icon_tool.png) -105px -90px no-repeat").attr("title","关闭语音");
             //调整音量
                $("#rg_volume").change(function(){
                 GLOBAL.webRTC.changeVolume(Number($(this).val()));
                 //alert(Number($(this).val()));
                });

            }else{
                    alert('请加入房间后使用此功能');
                    return;
            }


            //#mike_ctr end
          });

        /*流程图*/
            /*流程图使展开 ,画笔收起*/
    $(".sheet_bef").click(function(){
        if(u.username == null ){
            alert('亲,你没有登录是不能画流程图的O(∩_∩)O~' );
            return;
        }
        menuHideAll();
        $(".sheet_bef").hide("fast");
        $(".sheet").show("fast");
        
        $(".pen_aft").hide("fast");
        $(".pen_bef").show("fast");
        
        $("div#uml").css('z-index','-1');
        $("canvas#can").css('z-index','-3');
        
        }); 
            /*使收起*/
    $(".sheet .rp").click(function(){
        menuHideAll();
        $(".sheet").hide("fast");
        $(".sheet_bef").show("fast");
        
        
        
        }); 
    // 
    $('div[fcType]').click(function(){
        menuHideAll();
        var fcType = Number($(this).attr('fcType'));
        GLOBAL.flowChart.msHander({a:fcType,id: 'eleID',x:200,y:200,t:'\(^o^)/',local: 1});
            //alert(fcType);
    });
        /*画笔*/  
            /*画笔展开 流程图收起*/
    $(".pen_bef").click(function(){
        menuHideAll();
        $(".pen_bef").hide("fast");
        $(".pen_aft").show("fast");
        
        $(".sheet").hide("fast");
        $(".sheet_bef").show("fast");
        
        $("div#uml").css('z-index','-3');
        $("canvas#can").css('z-index','-1');
        
        
        });
            /*使收起*/
    $(".pen_aft .rp").click(function(){
        menuHideAll();
        $(".pen_aft").hide("fast");
        $(".pen_bef").show("fast");
        
        }); 
    //选中所有 toolId属性的标签ｄiｖ
    $("div[toolId]").click(function(){
        menuHideAll();
        var toolId = Number($(this).attr('toolId'));
        if(toolId === 7){
            GLOBAL.draw.reset();//清空画布
        }else{
            var x = toolId * (-35)
             GLOBAL.tool = toolId;
             //var y = toolId * (-45)
                 $('.p_now').css('background','url(/static/img/icon_tool.png) '+ x +'px -45px no-repeat');
                //  alert($('#p_now').css('background'));

        }
        
    });
      /*好友列表的点击弹出菜单 */
      $("#list_friends>label>div").live("click",function(){
        // change position
        objA = $(this).next()[0].innerHTML; 
        menuHideAll();
        var new_top = $(this).position().top+50;
        $("#menu_members").css({top:new_top}); // change positon
        $("#menu_members").toggle();
        $("#menu_members>ul>li>span")[0].id="f_M_please";
        $("#menu_members>ul>li>span")[1].id="f_M_delete";
        $("#menu_members>ul>li>a")[0].innerHTML = "邀请";
        $("#menu_members>ul>li>a")[1].innerHTML = "删除";
     });
     $("#list_members>div").live("click", function(){
        objA = $(this).next()[0].innerHTML;
        menuHideAll();
        var new_top = $(this).position().top+50;
        $("#menu_members").css({top:new_top});
        $("#menu_members").toggle();
        $("#menu_members>ul>li>span")[0].id="f_M_kick";
        $("#menu_members>ul>li>span")[1].id="f_M_look";
        $("#menu_members>ul>li>a")[0].innerHTML = "踢出";
        $("#menu_members>ul>li>a")[1].innerHTML = "加Ta";
     })
     $('#f_M_please, #f_M_please+a').live("click",function(){
        GLOBAL.user.invite(objA);
        $("#menu_members").toggle();
        return false;
    });
     $('#f_M_delete,#f_M_delete+a').live("click",function(){
        GLOBAL.user.set_friend("del_user", objA);
        $("#menu_members").toggle();
        return false;
    });
    $('#f_M_look,#f_M_look+a').live("click",function(){
        GLOBAL.user.set_friend("new_user", objA);
        $("#menu_members").toggle();
        return false;
    });
    $('#f_M_kick,#f_M_kick+a').live("click",function(){
        GLOBAL.user.kick(objA);
        $("#menu_members").toggle();
        return false;
    })
        /*颜色*/
            /*使展开*/
    $(".color_bef").click(function(){
        menuHideAll();
        $(".color_bef").hide("fast");
        $(".color").show("fast");
        });
    $(".color .rp").click(function(){
        menuHideAll();
        $(".color").hide("fast");
        $(".color_bef").show("fast");
        $("#color_picker").hide();
        });
    $('.close').each(function(){
      $(this).click(function(){
        $('.tipMessage').remove();
      });
    });
    $('.overlay').each(function(){
      $(this).click(function(){
        $('.tipMessage').remove();
      });
    });
    //-----------------------------------config--------------------------------------------
    //ajaxHelper.init();
    GLOBAL.user.islogin();
    $("#span_room_num").html("#");
    //alert('appearance');
    menuHideAll();

    //add button user event
    $("#btn_login").click(function(){
        var name = $("#text_login_username").val();
        var pw = $("#text_login_password").val();
        var hashed_pw = pw; // will do md5 hash later
        // var email="";
        if(name == '' || pw == '') {
            $('.sl_shape').after(createTip('用户名密码不能为空'));
        }
        else {
            $('.tipMessage').remove();
            GLOBAL.user.login(name, pw);
            $('#text_login_username').attr("value", "");
            $('#text_login_password').attr("value", "");
        }
    });
    $("#btn_register").click(function(){
        var name = $("#text_register_username").val();
        var email = $("#text_register_email").val();
        var pw = $("#text_register_password").val();
        var pw_repeat = $('#text_register_password_repeat').val();
        if(name == ""){
            $('.sl_shape').after(createTip('用户名呢?'));
        }
        else if(pw == ""){
            $('.sl_shape').after(createTip('我要密码'));
        }
        else if(pw != pw_repeat){
            $('.sl_shape').after(createTip('两次密码不一样哈.'));
        }
        else if(email == ""){
            $('.sl_shape').after(createTip('邮箱空了'));
        }
        else if(/\W/.test(name) == true){
            $('.sl_shape').after(createTip('用户名不合法.'))
        }
        else if(name.length < 4 || name.length > 20){
            $('.sl_shape').after(createTip('名字长度要求4-20个字符'));
        }
        else if(email.split('@')[1] == undefined || email.split('.')[1] == undefined){
            $('.sl_shape').after(createTip('邮箱格式不正确'));
        }
        else if(pw.length < 7 || pw.length >16 ){
            $('.sl_shape').after(createTip('密码要求7-16位之间'));
        }
        else{
          $('.tipMessage').remove();
          GLOBAL.user.register(name, pw, email);
          $("#text_register_username").attr("value", "");
          $("#text_register_email").attr("value", "");
          $("#text_register_password").attr("value", "");
          $('#text_register_password_repeat').attr("value", "");
        }
    });
    $("#btn_logout").click(function(){
        GLOBAL.user.logout();
        menuHideAll();
    });

    //room menu 's status
    $("#btn_room").click(function(){
        // 显示菜单
        menuRoomToggle();
    });

    //user action about room
    $("#btn_new_room_ok").click(function(){
        menuHideAll();
        var pw = $("#text_new_room_pw").val();
         GLOBAL.user.createRoom(pw);
    });
    $("#btn_addFriend").click(function(){
	GLOBAL.user.set_friend("new_user", $("#needToadd").val());
})
    $("#btn_leave_room1,#btn_leave_room2").click(function(){

        if (confirm("确定要离开房间么")) {
             GLOBAL.user.leaveRoom();
             
            $("#menu_members").hide();
            // GLOBAL.user.leaveRoom();//调用了两次?
            $("#span_room_num").html(u.username); // UI
        };
        menuHideAll();
    });
    $("#btn_enter_room_ok").click(function(){
        var number = $("#text_enter_room_number").val();
        var pw = $("#text_enter_room_pw").val();
        // TODO : check if "number" is number .
        if (pw==undefined) pw= ' ';
        if(/\D/.test(number) == true) {
          $('.sl_shape').after(createTip('求正确的房号'));
        }
        else{ 
          GLOBAL.user.enterRoom(number, pw);
          $("#span_room_num").html(u.username); // UI
          $('.tipMessage').remove();
          menuHideAll();
        }
    });
    $("#btn_room_settings_ok").click(function(){
        menuHideAll();
        var new_pw = $("#text_room_settings_pw").val();
        var new_mode = "free";
         GLOBAL.user.roomSetting(new_pw, new_mode);
    });
    $('#btn_modify_email').click(function(){
        var pw = $('#text_user_pw').val();
        var mail = $('#text_user_email').val();
        var new_mail = $('#text_user_email_new').val();
        if(new_mail == ""){
          $('.sl_shape').after(createTip('新邮箱不能为空'));
        }
        else if(pw == ""){
          $('.sl_shape').after(createTip('请提供原密码'));
        }
        else{
          s_data = {"old_pw":pw, "email":new_mail};
          GLOBAL.user.modify_profile(s_data, "email");
          $('.tipMessage').remove();
          $('#text_user_pw').attr("value", "");
          $('#text_user_email').attr("value", "");
          $('#text_user_email_new').attr("value", "");
          menuHideAll();
        }
    });
    $('#btn_modify_pw').click(function(){
        var pw = $('#text_user_pw_change').val();
        var pw_new = $('#text_user_pw_new').val();
        var pw_new_repeat = $('#text_user_pw_new_repeat').val();
        if(pw == ""){
          $('.sl_shape').after(createTip('求密码.'));
        }
        else if(pw_new != pw_new_repeat){
          $('.sl_shape').after(createTip('两次密码不同阿.'));
        }
        else{
          s_data = {"old_pw":pw, "hashed_pw":pw_new};
          GLOBAL.user.modify_profile(s_data, "pw");
          $('.tipMessage').remove();
          $('#text_user_pw_change').attr("value", "");
          $('#text_user_pw_new').attr("value", "");
          $('#text_user_pw_new_repeat').attr("value", "");
          menuHideAll();
        }  
    });

});
 
 /*window.onbeforeunload=function(){
      alert('head');   
      var n = window.event.screenX - window.screenLeft;   
      var b = n > document.documentElement.scrollWidth-20;   
      if(b && window.event.clientY < 0 || window.event.altKey)   
      {   
          alert("是关闭而非刷新");   
          window.event.returnValue =  "是否关闭？";
      }else{
             alert("是刷新而非关闭");   
     }   
}*/
