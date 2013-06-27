// JavaScript Document
$(document).ready(function(){
	$("#container").jvChart(300, 200);
	var v1 = $("#container").insertEllipse(10, 120, 80, 40, '椭圆');
		var s = {};
		s[jvConstants.STYLE_STROKECOLOR] = '#A0C88F';
		v1.setStyle(s);
	var v2 = $("#container").insertRectangle(100, 20, 80, 40, 10, '矩形');
	v2.setLabelLocation(jvConstants.LABEL_LOCATION_MIDDLE);
	var v4 = $("#container").insertEllipse(200, 100, 50, 50);
	
	var v3 = $("#container").insertRectangle(150, 180, 60, 40, 2);

	 
	
	$("#container").insertEdge(v1, v2);
	$("#container").insertEdge(v2, v3);
	$("#container").insertEdge(v2, v4);/**/


});