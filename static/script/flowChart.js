// JavaScript Document
/*本js用来实现流程图的绘制功能*/
// 说明
//    操作数:61--100为 流程图的操作码:
//     61 -- 80: 添加元素
//	   81: 拖动
//     82: 建立链接
//     83: 删除链接
//     84: 删除元素
//     85: 修改文本
//     86: 清空画布
//     87: 处理新成员的传送所以流程图的请求
//     CHANGE LOG : 3 Oct 2012, 修正了,流程图对象的ID不一致的bug.

 function FlowChart(div){
	 this.ele=[]; //{a:a,id:id,x:x,y:y,t:t}
	 
	 //this.init();
	 
	 this.div$ = null;
	 this.dx = 200;//defaltX
	 this.dy = 200;//defaltY
	 this.eleCount = 0;
	 this.eleNameCount = 0;
	 this.connCount = 0; //连接线计数器, 主要用来标记 连接线
	 this.connMs = []; //连接线消息 
	// this.init();
	 
	 if(this.cbi(div)){
		 alert('can not find the id == '+ div );
		 }else{
			 this.div$ = $('#'+div);
			 this.init()
		}
	
}
	 
 
 FlowChart.prototype={
	 init: function(){
		 //alert(' gety');
		// jsPlumb.setRenderMode(jsPlumb.CANVAS); //sh
		 
		 //初始化流程图样式
		 var self = this;
			jsPlumb.importDefaults({
			Endpoint : ["Dot", {radius: 0.1,cssClass:"myEndpoint"}],
			HoverPaintStyle : {strokeStyle:"#42a62c", lineWidth:2 },
			ConnectionOverlays : [
				[ "Arrow", { 
					location:1,
					id:"arrow",
					length:14,
					foldback:0.8
				} ],
				[ "Label", { label:" ", id:"label" , cssClass: "aLabel",
				             events:{click:function(diamondOverlay, originalEvent) { 
										 console.log(" click on diamond overlay for : " + diamondOverlay.component); 
										  }
		                              }
				
				}]
			],
		// LabelStyle : {label:"FOO1", id:"label"},
		});
		//end jsPlumb.importdefaulet
		// 绑定 jsPlumb的全局事件
		jsPlumb.bind("dblclick", function(c) { 
				//jsPlumb.detach(c);
				var ms = {
					a : 83,
					lb :  c.getOverlay("label").getLabel(),
					sid:  c.sourceId,
					tid:  c.targetId,
					};
				console.log(ms.a+" "+ms.lb + " ("+ms.sid+":"+ms.tid+") is detached");
				jsPlumb.detach(c);
				//`alert(self.connMs);
				for(var i= 0;i<self.connMs.length;i++){
					if(self.connMs[i].lb === ms.lb){
						self.connMs.splice(i,1);
						break;
						}
					}
			self.msSend(ms);
			});
			//end
			jsPlumb.bind("jsPlumbConnection", function(conn) {
				self.connCount++;
                conn.connection.setPaintStyle({strokeStyle:self.nextColour()});
				
				//alert(conn.connection.getLabel() === null );
				if((conn.connection.getLabel()) === null ){
					conn.connection.getOverlay("label").setLabel(self.connCount.toString());
					conn.connection.getOverlay("label").hide();	
						//conn.connection.setLabel('');
						var ms = {
						  a: 82,
						  sid: conn.connection.sourceId,
						  tid: conn.connection.targetId,
						  lb: self.connCount.toString(),
						  }
						  self.msSend(ms);
						var s = ms.sid + " is  connected to " + ms.tid;
						console.log(s);
				}
				else{
					conn.connection.getOverlay("label").setLabel(self.connCount.toString());
					conn.connection.getOverlay("label").hide();
				}
               conn.connection.setLabel('');
			   
			   self.connMs.push({a: 82,sid: conn.connection.sourceId,tid: conn.connection.targetId,lb: self.connCount.toString()});          
			   
            });
		//end
			
	 },
	//---------------------------------------------颜色生成器--------------------------------------------------------------///
	 //init() end
	 //获取下一个颜色
    curColourIndex :1, 
	maxColourIndex : 24,
	nextColour: function(){
		var R,G,B;
		R = parseInt(128+Math.sin((this.curColourIndex*3+0)*1.3)*128);
		G = parseInt(128+Math.sin((this.curColourIndex*3+1)*1.3)*128);
		B = parseInt(128+Math.sin((this.curColourIndex*3+2)*1.3)*128);
		this.curColourIndex = this.curColourIndex + 1;
		if (this.curColourIndex > this.maxColourIndex) this.curColourIndex = 1;
		return "rgb(" + R + "," + G + "," + B + ")";
		},
	 //end nextColor();
	 
	 
	 
	 
	 
//----------------------------------------------------通过id添加元素----------------------------------------------------///
	 //　通过ＩＤ添加元素  流程: makeSourse ---> makeTarget ---> draggble -----> double click ---->  text change 
	 addEle : function(eleID){
		 var ele$ = $("#"+eleID);
		 if(ele$.eq(0) === null){
			 return;
			 }
		 var e$=ele$.find(".fchart_ep");
		 var self=this;
		 jsPlumb.makeSource(e$, {
				parent:ele$,
				//anchor:"BottomCenter",
				anchor:"Continuous",
				connector:[ "StateMachine", { curviness:20 } ],
				connectorStyle:{ strokeStyle:self.nextColour(), lineWidth:2 },
				maxConnections:5,
                onMaxConnections:function(info, e) {
                    alert("已经达到最大连接数-- (" + info.maxConnections + ") (⊙o⊙)");
                }
			});
			
			
			jsPlumb.makeTarget(ele$, {
				dropOptions:{ hoverClass:"dragHover" },
				anchor:"Continuous"			
				//anchor:"TopCenter"			
			});
			
			
			//事件添加区
			//
			///
			///拖拽事件------------------------//
			jsPlumb.draggable(ele$,{
				stop:function(e,ui){
					var drid = $(this).attr('id');
					var point = self.getPosition({x:ui.offset.top,y:ui.offset.left});
					var ms = {
						  a:81,
						  id: drid,
						  x: point.x,
						  y: point.y,
						};
					console.log(ms.a+" " + ms.id +" is draged to " + ms.x + " " +ms.y);
					//alert(ms+' is dragged');
					for(var i= 0;i<self.ele.length;i++){
						if(self.ele[i].id === ms.id){
						self.ele[i].x = ms.x;
						self.ele[i].y = ms.y;
						break;
						}
					}
					
			
					self.msSend(ms);
					},
				cancel: '.fchart_content',
				
				containment : 'parent',
				
				});
			
			/*jsPlumb.bind("click", function(c) { 
				//jsPlumb.detach(c);
				alert("ob"); 
			});*/
			//双击 删除连线
			
			
			//删除元素-----------------------------//
			ele$.dblclick(function(e) {
              //  conson.log("");
			  	var deEle$ = $(this);
			 	 var ms = {
					a:84,
					id : deEle$.attr('id')
			 	}
			 	/*jsPlumb.detachAllConnections(deEle$);
				deEle$.remove();*/
				self.msDeAddE(ms);
			  	var s=ms.id + " "+ms.id+" is removed";
				self.msSend(ms);
			  	console.log(s);
			 // alert(ms);
            });
			
			//单击事件
            /*ele$.click(function(e){
				var ms=$(this).attr('id')+" is click";
			   console.log(ms);
				});*/
			/*ele$.find('div:first').click(function(e){
				e.stopPropagation();
				console.log($(this).parent().html());
				//$(this).focus()
				});*/
	//内容改变事件-------------------------------------//	
		ele$.find('div:first').blur(function(e){
			var text$ = $(this);
			var  ms = {
					a: 85,
					id: text$.parent().attr('id'),
					t: text$.text(),
				}
				var s = ms.a +" " + ms.pid + "'s  content is changed to " + ms.t;
				
				for(var i= 0;i<self.ele.length;i++){
						if(self.ele[i].id === ms.id){
						self.ele[i].t = ms.t;
						
						break;
						}
					}
					
			self.msSend(ms);
			console.log(s);
			});
          //end blur
		 // this.ele.push(eleID);
		 },
	 //end addEle()
//---------------------------------------添加元素结束--------好长啊----------------------------------------------------------------
	 
	 
	 //-----------------------------------清空流程图-------------------------------
	 reset : function(){
		 var self = this;
		$.each(this.ele,function(i,n){
			 self.msDeAddE({id: n.id});
			});
			
		this.ele = [];
		this.connCount = 0;
		this.connMs = [];
		this.eleNameCount = 0;
		var ms ={a:86
			}
		self.msSend(ms);
		 },// edn clear
	 msReset : function(){
		 
		 var self = this;
		$.each(this.ele,function(i,n){
			 self.msDeAddE({id: n.id});
			});
			
		this.ele = [];
		this.connCount = 0;
		this.connMs = [];
		this.eleNameCount = 0;
		 } ,
	 
 //-----------------------------------------------------消息处理部------------------------------------------------//	 
	 
	 //--------------------------------------------------发送消息部分 ------------------------------------
   msSend : function(ms){
       
       if(u.room != 0){
           
           websocketHelper.sendMs(2,'1',ms,null);
       }
       
       },//end msSend
    msSendToOne : function(ms,someone){
    	if(u.room != 0){
           
           websocketHelper.sendMs(2,someone,ms,null);
       }
    },//end msSendOne
   msSendAll: function(someone){
       //发送 元素]
        var self = this; 
       for(var i= 0;i<self.ele.length;i++){
            self.msSendToOne(self.ele[i],someone);
        }
        // 发送 连线
      for(var i= 0;i<self.connMs.length;i++){
                        self.msSendToOne(self.connMs[i],someone);
                        
                    }
    },//end msSendAll ();
    
	 
	 
	 
	 //消息处理器
	 msHander: function(ms){
	 	//var ms = ms.ms;
	 	//alert(JSON.stringify(ms));
		 var tmp = Math.floor(Number(ms.a)/10);
		 switch(tmp)
		 {
			 case 6: 
			 case 7: this.msAddE(ms);break;
			 case 8: 
			 case 9: this.msEventHander(ms);break;
		 }
		 
		 },
	 //end msHander()
	 
	 //----------------------------------------根据消息添加元素-----------------
	 msAddE : function(ms){
	 	//local参数判断消息是否来自本地,如果是本地消息则进行 id 命名 和 向其他用户发送消息,此处调用 全局变量 u 的name
	 	if(ms.local == 1){
		       ms.local = 0;
		       //if(u.username != null){}
		       var eleID = u.username + this.eleNameCount;
				   ms.id = eleID;

		      this.msSend(ms); 
		   }
		 switch(Number(ms.a)){
			 case 61:
					
						this.div$.append("<div  class='fchart61' id="+ms.id+" ><div class='fchart_content' contentEditable='true' >单击此处编辑文字</div><div class='fchart_ep'></div></div>");
					
			 break;
			 case 62:
			    
						this.div$.append("<div  class='fchart62' id="+ms.id+" ><div class='fchart_content' contentEditable='true' >单击此处编辑文字</div><div class='fchart_ep'></div></div>");
					
			    
			 break;
			  
			 case 63:
			 
			this.div$.append("<div  class='fchart63' id="+ms.id+" ><div class='fchart_content' contentEditable='true' >单击此处编辑文字</div><div class='fchart_ep'></div></div>");
			 break;
			  
			 case 64:
			 this.div$.append("<div  class='fchart64' id="+ms.id+" ><div class='fchart_content' contentEditable='true' >单击此处编辑文字</div><div class='fchart_ep'></div></div>");
			 break;
			  
			 case 65:this.div$.append("<div  class='fchart65' id="+ms.id+" ><div class='fchart_content' contentEditable='true' >单击此处编辑文字</div><div class='fchart_ep'></div></div>");
			 break;
			 
			 default: console.log('there is no this kind of element' + ms.a);
			 		  return;
			 //待添加
			 }
		   this.addEle(ms.id); //将元素修改成为一个jsPlumb 对象
		   //设置元素位置
		   this.msDrage(ms);
		   console.log(ms.id +' is added');
		   this.eleCount++;
		   this.eleNameCount ++;
		   
		   
		   
		   
		   this.ele.push(ms);
		   
		 },
	
	 //---------------------------------消息中的事件处理函数--------------------------------
	 msEventHander : function(ms){
		 switch(Number(ms.a)){
			 case 81: this.msDrage(ms);break;
			 case 82: this.msConn(ms);break;
			 case 83: this.msDeConn(ms);break;
			 case 84: this.msDeAddE(ms);break;
			 case 85: this.msText(ms);break;
			 case 87: this.handleQueryFc(ms);break;
			 default: console.log('there is no the event '+ms.a);
			 }
		 },
	 //end msEventHander();
	 //----------------------------------------------根据消息删除元素(84)---------------
	 msDeAddE : function(ms){
		 if(this.cbi(ms.id)){
			 console.log('can not find'+ms.id);
			 return false;
			 }
		 var deEle$ = $('#'+ms.id);
		 jsPlumb.detachAllConnections(deEle$);
	     deEle$.remove();
		 //管理 this.ele
		 this.eleCount --;
		 this.ele = $.map(this.ele,function(i){
			 	return i.id != ms.id ? i : null;
			 }
		 );
		 console.log(ms.id+ " is deteched by ms");
		 return true;
		 },
	// end ms DetE
	
	//-----------------------------------------根据消息链接线(82)----------------
	 msConn: function(ms){
		 if((this.cbi(ms.sid))||(this.cbi(ms.tid))){
			  console.log('can not find '+ms.sid +' he '+ ms.tid);
			  return false;
			 }
	    var conn = jsPlumb.connect({   //此处有bug,  用这个方法连接线的 endPoint. 删除连接线后不能 被擦除
				source: ms.sid,
				target: ms.tid,
				label: ms.lb,
			})
		
		console.log(ms.sid +' and '+ms.tid+ " is connected by ms"  + conn.getLabel());
		return true;
		 },
   //end msCon
   
   //--------------------------------根据消息删除连线-(83)--------------------------------
   msDeConn : function(ms){
	   var flag = false;
	   if((this.cbi(ms.sid))||(this.cbi(ms.tid))){
			  console.log('can not find '+ms.sid +' he '+ ms.tid);
			  return false;
			 }
	    jsPlumb.select({source:ms.sid, target:ms.tid}).each(function(c){
			//console.log(c.getOverlay("label").getLabel());
			if(c.getOverlay("label").getLabel() === ms.lb){
				jsPlumb.detach(c);
				flag = true;
				return ;
				}
			});
		//管理连接线	
		for(var i= 0;i< this.connMs.length;i++){
					if(this.connMs[i].lb === ms.lb){
						this.connMs.splice(i,1);
						break;
						}
		}
			
			if(flag){
				 console.log(ms.lb + " ("+ms.sid+":"+ms.tid+") is detached by ms");
				 return true;
				}
				else{
					console.log('can not find the connaction ' + ms.lb + 'between' + ms.sid + ' and '+ms.tid);
					return false;
		}
		  
		   
	   },
   
   //end  msDeConn
   
   //-----------------------------根据消息拖动元素 (81)----------------------------------------
   msDrage: function(ms){
	   var self = this;
	   if(this.cbi(ms.id)){
			 console.log('can not find'+ms.id);
			 return false;
			 }
		var ele$ = $('#'+ms.id);
		jsPlumb.animate(ms.id, {left:ms.y, top:ms.x}, { duration:1400, easing:'easeOutBack' });
		for(var i= 0;i<self.ele.length;i++){
						if(self.ele[i].id === ms.id){
						    var point = self.getPagePosition(ms);
						self.ele[i].x = point.x;
						self.ele[i].y = point.y;
						break;
						}
					}
		console.log( ms.id + ' is dragged to '+ '('+ms.x+' , '+ ms.y+')' );
	   },
   //end msDrage()
   
   //------------------------根据消息修改内容(85)--------------------------------------------
    msText: function(ms){
		var self = this;
		if(this.cbi(ms.id)){
			 console.log('can not find'+ms.id);
			 return false;
			 }
		$('#'+ms.id).find('div:first').text(ms.t);
		for(var i= 0;i<self.ele.length;i++){
						if(self.ele[i].id === ms.id){
						self.t = ms.t;
						break;
						}
					}
		console.log(ms.id + "'s text is changed to " + ms.t);	 
		},
   //end msText()
   
   //------------------根据id来判断元素是否存在  check by id --->cbi 存在 false  不存在 true-----------
   cbi: function(id){
	   return $('#'+id).attr('id') == undefined;
	   },
	// end checkById();

    // --------------根据页面位置 计算ele的相对 div的位置------------------------------------------------
     getPosition : function(point){
        var w =  (window.innerWidth - 1000)/2 ;// + ;
        var h = (window.innerHeight - 560)/2 ; //+ window.scrollMaxY;
          return {
           x: point.x - h,
           y: point.y - w, 
        }
        
     },
    //end offset
    //--------根据相对的div位置,计算ele相对于页面位置----------------
	getPagePosition : function(point)
	{
	    var w =  (window.innerWidth - 1000)/2 ;// + window.scrollMaxX;
        var h = (window.innerHeight - 560)/2 ; //+ window.scrollMaxY;
         return {
           x: point.x + h,
           y: point.y + w, 
        }  
	} ,
	//-------------------处理新加入房间的操作-----------------
	//发送请求房主流程图的请求,在appearance.js中被调用
	queryFC : function(localUser,roomOwner){
		var ms = {
			a: 87,
			who: localUser
		};
		this.msSendToOne(ms,roomOwner);
	},
	//end queryFc
	//房主处理请求
	handleQueryFc : function(ms){
		this.msSendAll(ms.who);
	}
}
//end prototype
