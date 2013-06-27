// JavaScript Document
$(document).ready(function(){
	/*好友列表*/
		/*使拉开*/
	$("#fm_bar_btn_be,#f_list,.f_up_right span").click(function(){
		$("#fm_bar_be").hide();
		$("div.f_down").show();
		});
		/*使收起*/
	$("#fm_bar_btn_af").click(function(){
		$("div.f_down").hide();
		$("#fm_bar_be").show();
		});
	/*聊天栏*/
		/*使拉开*/
	$("article.talk_bef").click(function(){
		$("article.talk_bef").hide();
		$("article.talk_aft").show();
		});
		/*使收起*/
	$(".talk_aft header").click(function(){
		$("article.talk_aft").hide();
		$("article.talk_bef").show();
		});
	/*工具栏*/
		/*流程图*/
			/*使展开*/
	$(".sheet_bef").click(function(){
		$(".sheet_bef").hide();
		$(".sheet").show();
		});	
			/*使收起*/
	$(".sheet .rp").click(function(){
		$(".sheet").hide();
		$(".sheet_bef").show();
		}); 
		/*画笔*/	
			/*使展开*/
	$(".pen_bef").click(function(){
		$(".pen_bef").hide();
		$(".pen_aft").show();
		});
			/*使收起*/
	$(".pen_aft .rp").click(function(){
		$(".pen_aft").hide();
		$(".pen_bef").show();
		});	
		/*颜色*/
			/*使展开*/
	$(".color_bef").click(function(){
		$(".color_bef").hide();
		$("c_now_bef").hide();
		$(".color").show();
		});
	$(".color .rp").click(function(){
		$(".color").hide();
		$(".color_bef").show();
		$("c_now_bef").show();
		});
	});