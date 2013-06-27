// JavaScript Document
// draw 消息定义{
			//a: ---------21-50 为绘图消息的消息   51-60 为操作消息
			  // 21: 画笔模式
			  // 22:  直线
			  // 23:  长方形
			  // 24:  方框
			  // 25:  圆形
			  // 26:  圆框
			  // 27:  橡皮擦
			  //51: 清空画布
			  
		   // p:----------路径: 画笔模式时按计时器取点,  其他的只取 开始的点,和结束的两点 
		   // c:----------颜色
		   // w:----------线宽
		   // co:---------CompositeOperation ; 
	//}
//本类依赖  全局变量
//重写 draw()
function Draw(canPre,can){
	this.canPre = canPre;
	this.can = can;
	this.canCtx = null; //can 的上下文
	this.stagePre = null;
	this.stage = null;
	this.isMouseDown = false;
	this.currentShape = null;
	this.path = [];
	this.p = []; //存储点,用来传送
	this.shapeCellection = [];
	this.oldMidX = 0;
	this.oldMidY = 0;
	this.oldX = 0;
	this.oldY = 0;
	this.textX = 0;
	this.textY = 0;
	//输入文本框区域位置
	this.textAreaX = 0;
	this.textAreaY = 0;
	//执行初始化函数
	if((typeof canPre == 'string')&& (typeof can == 'string') ){
		 this.init(canPre,can);
		}else{
			alert ('can not find canvas '+canPre +' and '+ can);
			}
}

Draw.prototype = {
	//------------------------------初始化函数-------------------
	init:　function(canPre,can){
		var canvPre = document.getElementById(canPre);
		this.stagePre = new Stage(canPre)
		var can = document.getElementById(can);
		
		this.stage = new Stage(can);
		this.stageRem = new Stage(can);
		this.stagePre.autoClear = true;
		this.stage.autoClear = true;
		Touch.enable(this.stagePre);
		Touch.enable(this.stage);
		
		this.s = new Shape();
		var g = this.s.graphics;
		g.beginFill(Graphics.getRGB(255,0,0));
    	g.drawCircle(0,0,3);
		this.stagePre.addChild(this.s);
		this.stagePre.update();
		
		Ticker.addListener(this);
		this.bindEvent();
		
	},//end init()
	// ---------------------------绑定事件--------------
	bindEvent: function(){
		var self = this;
		//---------------------------------------------------------绑定鼠标左键按下事件------
		this.stagePre.onMouseDown = function(){
			//console.log('leftmouse button is pressed!');
			self.isMouseDown = true;
	//self.stagePre.removeChild(self.s);
		
		   // alert("down");
			var s = new Shape();
			self.oldX = self.stagePre.mouseX;
			self.oldY = self.stagePre.mouseY;
			self.oldMidX = self.stagePre.mouseX;
			self.oldMidY = self.stagePre.mouseY;
			
			var p = new Point(self.stagePre.mouseX, self.stagePre.mouseY);
			self.path.push(p); 
			 
			var g = s.graphics;
			
			
			//g.beginFill(Graphics.getRGB(255,0,0));
			//g.drawCircle(0,0,3);
			
			switch(GLOBAL.tool){
				
					  case 0 :{     
						  g.setStrokeStyle(GLOBAL.lineWidth, 'round', 'round');
						  g.beginStroke(GLOBAL.color);
						  
						 break;  
							  }
					  case 1:{
						   g.setStrokeStyle(GLOBAL.lineWidth, 'round', 'round');
						   g.beginStroke(GLOBAL.color);
								 break;
							 }
					  case 2:{
		
								 break;
							 }
					  case 3:{
								 break;
							 }
					  case 4:{
								 break;
		
							 }
					  case 5:{
								 
								 break;
							 }
					  case 6:{
						  //self.currentShape.compositeOperation ='xor';
						  g.setStrokeStyle(GLOBAL.lineWidth, 'round', 'round');
						  g.beginStroke('rgba(255,0,0,1)');
						     
								 break;
							 }
					  case 7:{
							//self.msGoback(); //
							self.reset();
								 break;
							 }
		
		
					}
			self.stagePre.addChild(s);
			self.currentShape = s;
			
			}// onMouseDown
		//-----------------------------------------------------------------------绑定鼠标左键松开事件-------
		this.stagePre.onMouseUp  = function(){
			if(self.isMouseDown){
				    var ms = { a:0,
							   w: GLOBAL.lineWidth,
							   c: GLOBAL.color,
							   co: 'source-over',
							   p: [],
						
						}
				   
				   // self.currentShape.compositeOperation = 'source-out';
					self.isMouseDown = false;
					switch(GLOBAL.tool){
							  case 0 :{
									ms.a = 21;
									ms.p = self.p;
									//alert( '');
										  break;
									  }
							  case 1:{
								  ms.a = 22; 
								  ms.p.push(self.p[0]);
								  ms.p.push(self.p.pop());
										 break;
									 }
							  case 2:{
									ms.a = 23;
								  ms.p.push(self.p[0]);
								  ms.p.push(self.p.pop());
										 break;
									 }
							  case 3:{
								  ms.a = 24;
								  ms.p.push(self.p[0]);
								  ms.p.push(self.p.pop());

										 break;
									 }
							  case 4:{
								  ms.a = 25;
								   ms.p.push(self.p[0]);
								  ms.p.push(self.p.pop());
										 break;
									 }
							  case 5:{
								  ms.a = 26;
								  ms.p.push(self.p[0]);
								  ms.p.push(self.p.pop());
										 break;
									 }
							  case 6:{
								  ms.a = 27;
								  ms.p = self.p;
								  self.currentShape.compositeOperation ='destination-out';
								  ms.co = 'destination-out';
								  ms.c = 'rgba(255,0,0,1)';
										 break;
									 }
							  case 7:{
								 // ms.a = 28
									//	 break;
									 }
							}
						
					//var ctx = self.stage.canvas.getContext('2d');
						//alert(ctx.globalCompositeOperation);
					//ctx.globalCompositeOperation = 'destination-out';
						//alert(ctx.globalCompositeOperation);
						
					//self.currentShape.compositeOperation ='destination-out';
					self.stage.addChild(self.currentShape);
					self.stage.update();
					
					self.stagePre.removeChild(self.currentShape);
					self.stagePre.update();
					//self.currentShape.uncache();
					self.shapeCellection.push(self.currentShape);
					
					//发送消息
					
					
					if(ms.p[0] != ms.p[20]){
					self.msSend(ms);
					}
					self.path=[];
					self.p = [];
					
					
				   }
			}
		},//end bindEvent()
		
	//-------------------时钟函数......tick()----------
	tick:function() {
		//alert(this.isMouseDown);
		if (this.isMouseDown) {
			//alert(this.stagePre.mouseX +" + "+ this.stagePre.mouseY);
			//
			//alert("move");
			//console.log('tick');
			var pt = new Point(this.stagePre.mouseX, this.stagePre.mouseY);
			this.path.push(pt);
			this.p.push({x:pt.x,y:pt.y});
			var midPoint = new Point(this.oldX + pt.x>>1, this.oldY+pt.y>>1);
			var g = this.currentShape.graphics;
			
			
			switch(GLOBAL.tool){
				  case 0 :{     
							g.moveTo(midPoint.x, midPoint.y);
							g.curveTo(this.oldX, this.oldY, this.oldMidX, this.oldMidY);
							
							break;
						  }
				  case 1:{
					  this.stagePre.clear();
					  g.clear();
					  g.setStrokeStyle(GLOBAL.lineWidth, 'round', 'round');
					  g.beginStroke(GLOBAL.color);
					  g.moveTo(this.path[0].x,this.path[0].y);
					  g.lineTo(pt.x,pt.y);
					  
							 break;
						 }
				  case 2:{
						  this.stagePre.clear();
						  g.clear();

						  var w = pt.x - this.path[0].x;
					  	  var h = pt.y - this.path[0].y;
					 	  //console.log(GLOBAL.color);
					      g.beginFill(GLOBAL.color);
					     //g.beginFill('rgb(0,0,0)');
					     g.rect(this.path[0].x,this.path[0].y,w,h)
						  
						  
						break;
						 }
				  case 3:{
					 // ---
					  this.stagePre.clear();
					  g.clear();
					  
					  	  var w = pt.x - this.path[0].x;
						  var h = pt.y - this.path[0].y;
						  g.setStrokeStyle(GLOBAL.lineWidth, 'round', 'round');
						  g.beginStroke(GLOBAL.color);
						  g.rect(this.path[0].x,this.path[0].y,w,h)
						break;
					// ----
						 }
				  case 4:{
					  this.stagePre.clear();
					  g.clear();
					  
					  var w = pt.x - this.path[0].x;
					  var h = pt.y - this.path[0].y;
					  g.setStrokeStyle(GLOBAL.lineWidth, 'round', 'round');
					  g.beginFill(GLOBAL.color);
					  g.drawEllipse(this.path[0].x,this.path[0].y,w,h)
					  
					  break;
	
						 }
				  case 5:{
					  this.stagePre.clear();
					  g.clear();
					  
					  var w = pt.x - this.path[0].x;
					  var h = pt.y - this.path[0].y;
					  g.setStrokeStyle(GLOBAL.lineWidth, 'round', 'round');
					  g.beginStroke(GLOBAL.color);
					  g.drawEllipse(this.path[0].x,this.path[0].y,w,h)
							 
							 break;
						 }
				  case 6:{
					  g.moveTo(midPoint.x, midPoint.y);
					  g.curveTo(this.oldX, this.oldY, this.oldMidX, this.oldMidY);
							
							 break;
						 }
				  case 7:{
	
							 break;
						 }
	
	
				}
			
			this.oldX = pt.x;
			this.oldY = pt.y;
			
			this.oldMidX = midPoint.x;
			this.oldMidY = midPoint.y;
			this.stagePre.addChild(this.currentShape);
			
			this.stagePre.update();
		}
	},//end tick()
	
	//--------------------stop()函数------------------------
	 stop :function() {
			
	        Ticker.removeListener(this);
       },//end stop()
	   // -------------------- 发送消息部分----------------------
	msSend : function(ms){
	    if(u.room != 0){
	    websocketHelper.sendMs(1,'1',ms,null);
		console.log('消息 '+ms.a +' is sended :: size is ' + JSON.stringify(ms).getBytesLength() );
		  }
		},//end msSend
	//-----------------------消息处理函数----------------------
	msHander : function(ms){
	   // alert(JSON.stringify(ms));
		if(typeof ms === 'object'){
		    var ms = ms.ms;
			var a =  Math.floor(Number(ms.a)/10);
			switch(a){
				case 2: 
				case 3: 
				case 4: {this.msDraw(ms);}break;
				case 5: {this.msDo(ms);}break;
				default : console.log("msHander's ms is error");break;
				}
			}
		},// end msHander
	//-------------------------消息绘图------------------------
	msDraw : function(ms){
		switch(ms.a){
				case 21: {this.msCurve(ms);}break;
				case 22: {this.msLine(ms);}break;
				case 23: {this.msRectF(ms);}break;
				case 24: {this.msRectS(ms);}break;
				case 25: {this.msEllipseF(ms);}break;
				case 26: {this.msEllipseS(ms);}break;
				case 27: {this.msErase(ms);}break;
				default: console.log("msDraw's  message is error");
				}
		},//end function
	//-------------------- 消息画曲线------------------------
	msCurve :function(ms){
		if(typeof ms === 'object'){
			var p = ms.p;
            var oldX = p[0].x;
            var oldY = p[0].y;
            var oldMidX = p[0].x;
            var oldMidY = p[0].y;
			
			
			var s = new Shape();
            var g = s.graphics;
           	
			s.compositeOperation = ms.co;
			
            g.setStrokeStyle(ms.w, 'round', 'round');
            
            g.beginStroke(ms.c);
            this.stage.addChild(s);
            
			for(var i = 0 ; i<p.length; i++){
				var pt = new Point(p[i].x, p[i].y);
				var midPoint = new Point(oldX + pt.x>>1, oldY+pt.y>>1);
                s.graphics.moveTo(midPoint.x, midPoint.y);
                s.graphics.curveTo(oldX, oldY, oldMidX, oldMidY);

                oldX = pt.x;
                oldY = pt.y;

                oldMidX = midPoint.x;
                oldMidY = midPoint.y;
				this.stage.update();
				}
			}
			
			this.shapeCellection.push(s);
		},
	msErase :function(ms){
		if(typeof ms === 'object'){
			var p = ms.p;
            var oldX = p[0].x;
            var oldY = p[0].y;
            var oldMidX = p[0].x;
            var oldMidY = p[0].y;
			
			
			var s = new Shape();
            var g = s.graphics;
           	
			s.compositeOperation = ms.co;
			
            g.setStrokeStyle(ms.w, 'round', 'round');
            
            g.beginStroke(ms.c);
            this.stage.addChild(s);
            
			for(var i = 0 ; i<p.length; i++){
				var pt = new Point(p[i].x, p[i].y);
				var midPoint = new Point(oldX + pt.x>>1, oldY+pt.y>>1);
                s.graphics.moveTo(midPoint.x, midPoint.y);
                s.graphics.curveTo(oldX, oldY, oldMidX, oldMidY);

                oldX = pt.x;
                oldY = pt.y;

                oldMidX = midPoint.x;
                oldMidY = midPoint.y;
				this.stage.update();
				}
			}
			
			this.shapeCellection.push(s);
		},
	//end 
	//--------------------消息画直线-------------------------
	msLine : function(ms){
				var s = new Shape();
            	var g = s.graphics;
				
				s.compositeOperation = ms.co;
				
				g.setStrokeStyle(ms.w, 'round', 'round');
				g.beginStroke(ms.c);
				g.moveTo(ms.p[0].x,ms.p[0].y);
				g.lineTo(ms.p[ms.p.length-1].x,ms.p[ms.p.length-1].y);
				
				
				this.stage.addChild(s);
				this.stage.update();
				
				this.shapeCellection.push(s);
		},
	//edn
	//--------------------消息画长方形-----------------------
	msRectF : function(ms){
			var s = new   Shape();
        	var g = s.graphics;
			//alert('msRectF');
			s.compositeOperation = ms.co;
			
			var w = ms.p[ms.p.length-1].x - ms.p[0].x;
			var h = ms.p[ms.p.length-1].y - ms.p[0].y;
				g.beginFill(ms.c);
				g.rect(ms.p[0].x,ms.p[0].y,w,h);
		
			this.stage.addChild(s);
			this.stage.update();
			this.shapeCellection.push(s);	
		},
	//end
	//--------------------消息画方框-----------------------
	msRectS : function(ms){
		var s = new   Shape();
        var g = s.graphics;
		
		s.compositeOperation = ms.co;
		
		var w = ms.p[ms.p.length-1].x - ms.p[0].x;
		var h = ms.p[ms.p.length-1].y - ms.p[0].y;
			g.setStrokeStyle(ms.w, 'round', 'round');
			g.beginStroke(ms.c);
			g.rect(ms.p[0].x,ms.p[0].y,w,h);
		
		this.stage.addChild(s);
		this.stage.update();
		
		this.shapeCellection.push(s);
		},
	//end
	//--------------------消息画椭圆-------------------------
	msEllipseF : function(ms){
		var s = new   Shape();
        var g = s.graphics;
		
		s.compositeOperation = ms.co;
		
		var w = ms.p[ms.p.length-1].x - ms.p[0].x;
		var h = ms.p[ms.p.length-1].y - ms.p[0].y;
			g.beginFill(ms.c);
			g.drawEllipse(ms.p[0].x,ms.p[0].y,w,h)
		
		this.stage.addChild(s);
		this.stage.update();
		
		this.shapeCellection.push(s);
		},
	//end
	//--------------------消息画椭圆框------------------------
	msEllipseS : function(ms){
		var s = new   Shape();
        var g = s.graphics;
		
		s.compositeOperation = ms.co;
		
		var w = ms.p[ms.p.length-1].x - ms.p[0].x;
		var h = ms.p[ms.p.length-1].y - ms.p[0].y;
		    g.setStrokeStyle(ms.w, 'round', 'round');
			g.beginStroke(ms.c);
			g.drawEllipse(ms.p[0].x,ms.p[0].y,w,h)
		
		this.stage.addChild(s);
		this.stage.update();
		
		this.shapeCellection.push(s);
		},
	//end
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//-------------------------操作消息----------------------------------------------------------------------------------------------
	msDo : function(ms){
		switch(ms.a){
				case 51: {this.msReset(ms);}break;
				case 52: {this.msGoback(ms);}break;
				//case 23: {this.msRectF(ms);}break;
				//case 24: {this.msRectS(ms);}break;
				//case 25: {this.msEllipseF(ms);}break;
				//case 26: {this.msEllipseS(ms);}break;
				//case 27: {this.(ms)}break;
				default: console.log("msDo's  message is error");
				}
		},
	// end msDo
	//-------------------------重置画板----------------------
	reset : function(){
		
		if(confirm('清空所有人的画布?')){
			this.msReset();
			this.msSend({a:51});
			}
		},
	//end 
	msReset : function (){
		//this.stage.shape.graphics.clear()
		//if(this.currentShape.graphics!= null){
			//this.currentShape.graphics.clear()
			//}
			//var i =1;
		//alert(this.shapeCellection.length);
		for(var i = 0 ; i< this.shapeCellection.length;i++ ){
			
			this.stage.removeChild(this.shapeCellection[i]);
			//this.shapeCellection[i].graphics.clear();
			this.shapeCellection[i].uncache();
		 }
		this.shapeCellection = [];
		this.stage.clear();
		this.stage.update();
		},
	//---------------------------取消上一笔------------------------------
	msGoback : function(){
		var s = this.shapeCellection.pop();
		//alert(s);
		console.log(s +'  is deleted  ' + (s != 'undefined'))
		if(s != 'undefined'){
			this.stage.removeChild(s);
			s.uncache();
		}
		
		
		this.stage.update();
		},
	
	//end msGoback
	goback : function(){
		this.msGoback();
		this.msSend({a:52});
		}
	
	
}//end draw.prototype