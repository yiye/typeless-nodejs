importScripts("/static/script/jquery.nodom.js");
// jquery.nodom --- https://github.com/kpozin/jquery-nodom
self.postMessage("I'm working befor postMessage('ali').");
self.onmessage = function(event) {
	$.post("/ajax",{"state":"0","act":"heartbeat","data":" "},function(res){
					self.postMessage("server return:"+res)
				});
};