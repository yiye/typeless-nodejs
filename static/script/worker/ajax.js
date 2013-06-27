importScripts("/static/script/jquery.nodom.js");
// jquery.nodom --- https://github.com/kpozin/jquery-nodom


//self.postMessage("I'm working befor postMessage('ali').");
self.onmessage = function(e) {
	$.post("/ajax",e.data,function(data,textStatus){
	                if(textStatus === 'success')
					    self.postMessage(JSON.parse(data))
					else{
					   var ms = {"state": "9", "data": {"type": "a", "ms": " ", }, "act": "ajax_erro"}
					  self.postMessage(JSON.parse(ms))
					}
					
				});
};



