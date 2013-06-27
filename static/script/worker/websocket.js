// JavaScript Document
//
//最终消息格式:
//  { a:  1: 发送 draw 的消息 2: 发送 flowChart 的消息  3:chart 聊天消息 4.sy为操作消息 5: 建立连接 6: 修改连接 7.断开连接 8 : worker 的消息
//    n:  发送者姓名
//	  u:  发送者的url
//	  d:  发送的对象 如果为 "1"则为所有人 . 具体时则为发送对象的名称
//	  ms: 消息
//   }
var ws ;//WebSocket 对象
var name;// 用户姓名
function bindWS(ws){
			ws.onopen = function(e){
				postMessage({a:8 , ms:ws.url + ' is opened'});
			}
			ws.onclose = function(e){
				postMessage({a:8 , ms:ws.url + ' is closed'});
			}
			ws.onmessage = function(e){
				var ms = JSON.parse(e.data); //parse() 错误会 返回 Unexpected token o
				//postMessage({a:8 ,ms:'收到消息为: \n'+' 类型: '+ms.a+' \n发送目标: '+ms.d+' \n发送者: '+ms.n + '\n消息内容:'+JSON.stringify(ms.ms) /**/+ "\n在worker中的name是:" +name });
                
				
				if((ms.n != name) && (ms.d == '1' || ms.d == name)){ //条件为 不是自己发的消息  并且是发给自己的
					postMessage({a:8 ,ms:'收到消息为: \n'+' 类型: '+ms.a+' \n发送目标: '+ms.d+' \n发送者: '+ms.n + '\n消息内容:'+JSON.stringify(ms.ms) /**/+ "\n在worker中的name是:" +name });
				 postMessage(ms);

				}
				
			}		
	}
	
	
onmessage = function(e){
	//postMessage({a:8, ms:typeof e == 'object'} );
		//var ws;
	if (typeof e == 'object'){
		switch(e.data.a){
			
			//log('new web socket');
			
			case 1:
			case 2:
			case 3:
			case 4:
			
		    ws.send(JSON.stringify(e.data));
			//postMessage({a:8 , ms: e.data.ms + ' is sended'});
			break;
			//)
			case 5:
			name = e.data.n;
			ws = new WebSocket(e.data.u);
			bindWS(ws);//
			break;
			
			case 6:
			ws.close();
			ws = new WebSocket(e.data.u);break;
			bindWS(ws);
			case 7:
			ws.close();break;
		};
			
			
	}else{
		postMessage({a:8 ,ms: 'type of e is '+ typeof e +' not a JSON'})
		}	
			
}
//postMessage({a:8 , ms: typeof ws + ' is ms'});

