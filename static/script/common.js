// JavaScript Document
/*本层主要用实现实现复用的组件
 */
 /*有全局变量的控制函数 GLOBAL
  *GLOBAL函数的主要使用方法是  
  *添加变量 调用函数 GLOBAL.namespace("A.B");
  *A指的是功能块,B指的是全局变量
  *使用变量 GLOBAL.A.B*/
 var GLOBAL={};
 GLOBAL.namespace=function(str){
	 var arr=str.split("."),o=GLOBAL;
	 for(i=(arr[0]=="GlOBAL")?1:0;i<arr.length;i++){
		 o[arr[i]]=o[arr[i]]||{};
		 o=o[arr[i]];
		 }
	 }
GLOBAL.namespace('color');
GLOBAL.color = 'rgb(0,0,0)';//设置默认颜色为黑色
GLOBAL.namespace('lineWidth');
GLOBAL.lineWidth = 5;// 默认宽度为10个像素
GLOBAL.namespace('tool');
GLOBAL.tool = 0;
/*坐标点的精确 定位函数*/
function getBodyOffsetTop(el){ 
    var top = 0; 
    do{ 
      top = top + el.offsetTop; 
    }while(el = el.offsetParent); 
    return top; 
    } 
function getBodyOffsetLeft(el){
      var left = 0; 
     do{ 
       left = left + el.offsetLeft; 
     }while(el = el.offsetParent); 
     return left; 
    } 
    

//计算字符串长度
String.prototype.getBytesLength = function() {   
    var totalLength = 0;     
    var charCode;  
    for (var i = 0; i < this.length; i++) {  
        charCode = this.charCodeAt(i);  
        if (charCode < 0x007f)  {     
            totalLength++;     
        } else if ((0x0080 <= charCode) && (charCode <= 0x07ff))  {     
            totalLength += 2;     
        } else if ((0x0800 <= charCode) && (charCode <= 0xffff))  {     
            totalLength += 3;   
        } else{  
            totalLength += 4;   
        }          
    }  
    return totalLength;   
}  

//　初始化　各个类　作为程序启动的开始
$(function(){
                // 初始化用户类
                GLOBAL.namespace('user')
                GLOBAL.user = new User();

        //初始化 绘图工具
         
        GLOBAL.namespace('draw');
        GLOBAL.draw = new Draw('preCan','can');
        //var fc = new FlowChart('demo');
        //初始化 流程图工具
        GLOBAL.namespace('flowChart');
        GLOBAL.flowChart =  new FlowChart('uml');
        //初始化 聊天 工具
        GLOBAL.namespace('wordChat');
        GLOBAL.wordChat = new WordChat('dialogs','inBox','sureBtn');
    
        //初始化 系统消息
        
        GLOBAL.namespace('system');
        GLOBAL.system = null;
      }
        
      );



//基础类 来自John Resig的继承方法  
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/
  this.Class = function(){}
  Class.extend = function(prop) {
    var _super = this.prototype;
    initializing = true;
    var prototype = new this();
    initializing = false;
    for (var name in prop) {
      
      prototype[name] = typeof prop[name] == "function" && 
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super; 
            this._super = _super[name];
            var ret = fn.apply(this, arguments);        
            this._super = tmp;
            
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
    
    
    function Class() {
      
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
    Class.prototype = prototype;
    Class.prototype.constructor = Class;
    Class.extend = arguments.callee;
    return Class;
  };
})();



///end class

/*!
 * jQuery UI Touch Punch 0.2.2
 *
 * Copyright 2011, Dave Furfero
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Depends:
 *  jquery.ui.widget.js
 *  jquery.ui.mouse.js
 */
(function ($) {

  // Detect touch support
  $.support.touch = 'ontouchend' in document;

  // Ignore browsers without touch support
  if (!$.support.touch) {
    return;
  }

  var mouseProto = $.ui.mouse.prototype,
      _mouseInit = mouseProto._mouseInit,
      touchHandled;

  /**
   * Simulate a mouse event based on a corresponding touch event
   * @param {Object} event A touch event
   * @param {String} simulatedType The corresponding mouse event
   */
  function simulateMouseEvent (event, simulatedType) {

    // Ignore multi-touch events
    if (event.originalEvent.touches.length > 1) {
      return;
    }

    event.preventDefault();

    var touch = event.originalEvent.changedTouches[0],
        simulatedEvent = document.createEvent('MouseEvents');
    
    // Initialize the simulated mouse event using the touch event's coordinates
    simulatedEvent.initMouseEvent(
      simulatedType,    // type
      true,             // bubbles                    
      true,             // cancelable                 
      window,           // view                       
      1,                // detail                     
      touch.screenX,    // screenX                    
      touch.screenY,    // screenY                    
      touch.clientX,    // clientX                    
      touch.clientY,    // clientY                    
      false,            // ctrlKey                    
      false,            // altKey                     
      false,            // shiftKey                   
      false,            // metaKey                    
      0,                // button                     
      null              // relatedTarget              
    );

    // Dispatch the simulated event to the target element
    event.target.dispatchEvent(simulatedEvent);
  }

  /**
   * Handle the jQuery UI widget's touchstart events
   * @param {Object} event The widget element's touchstart event
   */
  mouseProto._touchStart = function (event) {

    var self = this;

    // Ignore the event if another widget is already being handled
    if (touchHandled || !self._mouseCapture(event.originalEvent.changedTouches[0])) {
      return;
    }

    // Set the flag to prevent other widgets from inheriting the touch event
    touchHandled = true;

    // Track movement to determine if interaction was a click
    self._touchMoved = false;

    // Simulate the mouseover event
    simulateMouseEvent(event, 'mouseover');

    // Simulate the mousemove event
    simulateMouseEvent(event, 'mousemove');

    // Simulate the mousedown event
    simulateMouseEvent(event, 'mousedown');
  };

  /**
   * Handle the jQuery UI widget's touchmove events
   * @param {Object} event The document's touchmove event
   */
  mouseProto._touchMove = function (event) {

    // Ignore event if not handled
    if (!touchHandled) {
      return;
    }

    // Interaction was not a click
    this._touchMoved = true;

    // Simulate the mousemove event
    simulateMouseEvent(event, 'mousemove');
  };

  /**
   * Handle the jQuery UI widget's touchend events
   * @param {Object} event The document's touchend event
   */
  mouseProto._touchEnd = function (event) {

    // Ignore event if not handled
    if (!touchHandled) {
      return;
    }

    // Simulate the mouseup event
    simulateMouseEvent(event, 'mouseup');

    // Simulate the mouseout event
    simulateMouseEvent(event, 'mouseout');

    // If the touch interaction did not move, it should trigger a click
    if (!this._touchMoved) {

      // Simulate the click event
      simulateMouseEvent(event, 'click');
      simulateMouseEvent(event,'dblclick');
    }

    // Unset the flag to allow other widgets to inherit the touch event
    touchHandled = false;
  };

  /**
   * A duck punch of the $.ui.mouse _mouseInit method to support touch events.
   * This method extends the widget with bound touch event handlers that
   * translate touch events to mouse events and pass them to the widget's
   * original mouse event handling methods.
   */
  mouseProto._mouseInit = function () {
    
    var self = this;

    // Delegate the touch handlers to the widget's element
    self.element
      .bind('touchstart', $.proxy(self, '_touchStart'))
      .bind('touchmove', $.proxy(self, '_touchMove'))
      .bind('touchend', $.proxy(self, '_touchEnd'));

    // Call the original $.ui.mouse init method
    _mouseInit.call(self);
  };

})(jQuery);
