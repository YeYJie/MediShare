var patientInspection = new Map;

var showInspections = function(pid) {
	console.log("showInspections", pid, patientInspection[pid]);
	var inspections = patientInspection[pid];
	var res = "";
	if(!inspections) return res;
	inspections.forEach(function(ins){
		res += buildInspection(ins);
	});
	return res;
};

var buildInspection = function(ins) {
	if(ins.inspection === "xuechanggui")
		return xuechangguiInspection(ins);
	else if(ins.inspection === "gangongneng")
		return gangongnengInspection(ins);
	else if(ins.inspection === "liangduiban")
		return liangduibanInspection(ins);
}

var xuechangguiInspection = function(ins) {
	if(ins.inspection !== "xuechanggui") return "";

	var res = '<div class="row">'
		+'<div class="col-md-8">'
		+'	<label class="col-form-label"><h3>血常规检测报告</h3></label>'
		+'	<table class="table table-striped">'
		+'		<thead>'
		+'			<th class="col-md-2">测试项目</th>'
		+'			<th class="col-md-1">缩写</th>'
		+'			<th class="col-md-2">结果</th>'
		+'			<th class="col-md-1">单位</th>'
		+'			<th class="col-md-1">提示</th>'
		+'			<th class="col-md-1">参考范围</th>'
		+'		</thead>'
		+'		<tbody>'
		+'			<tr><td>谷草转氨酶</td><td>AST</td><td><input value="'+ins.AST+'" readonly/></td><td>U/L</td><td>H</td><td>15~40</td></tr>'
		+'			<tr><td>谷丙转氨酶</td><td>ALT</td><td><input value="'+ins.ALT+'" readonly/></td><td>U/L</td><td></td><td>3~35</td></tr>'
		+'			<tr><td>谷草/谷丙转氨酶比值</td><td>S/L</td><td><input value="'+ins.SL+'" readonly/></td><td></td><td></td><td>0.91~2.25</td></tr>'
		+'			<tr><td>总蛋白</td><td>TPROT</td><td><input value="'+ins.TPROT+'" readonly/></td><td>g/L</td><td></td><td>61.0~82.0</td></tr>'
		+'			<tr><td>白蛋白</td><td>ALB</td><td><input value="'+ins.ALB+'" readonly/></td><td>g/L</td><td></td><td>36.0~51.0</td></tr>'
		+'			<tr><td>球蛋白</td><td>GLB</td><td><input value="'+ins.GLB+'" readonly/></td><td>g/L</td><td></td><td>25.0~35.0</td></tr>'
		+'			<tr><td>白蛋白/球蛋白</td><td>A/G</td><td><input value="'+ins.AG+'" readonly/></td><td></td><td></td><td>1.2~2.5</td></tr>'
		+'			<tr><td>总胆红素</td><td>TBILI</td><td><input value="'+ins.TBILI+'" readonly/></td><td>umol/L</td><td></td><td>4.0~23.9</td></tr>'
		+'			<tr><td>直接胆红素</td><td>DBILI</td><td><input value="'+ins.DBILI+'" readonly/></td><td>umol/L</td><td></td><td>0~6.8</td></tr>'
		+'			<tr><td>间接胆红素</td><td>IBILI</td><td><input value="'+ins.IBILI+'" readonly/></td><td>umol/L</td><td></td><td>2.6~20.9</td></tr>'
		+'			<tr><td>谷氨酰转肽酶</td><td>GGT</td><td><input value="'+ins.GGT+'" readonly/></td><td>U/L</td><td>H</td><td>10~60</td></tr>'
		+'			<tr><td>总胆汁酸</td><td>TBA</td><td><input value="'+ins.TBA+'" readonly/></td><td>umol/L</td><td></td><td>0~14.0</td></tr>'
		+'			<tr><td>磷</td><td>IPHOS</td><td><input value="'+ins.IPHOS+'" readonly/></td><td>umol/L</td><td></td><td>0.74~1.52</td></tr>'
		+'			<tr><td>尿素氮</td><td>BUN</td><td><input value="'+ins.BUN+'" readonly/></td><td>umol/L</td><td></td><td>2.4~8.2</td></tr>'
		+'			<tr><td>肌酐(酶法)</td><td>CREAT</td><td><input value="'+ins.CREAT+'" readonly/></td><td>umol/L</td><td></td><td>31.8~116.0</td></tr>'
		+'			<tr><td>磷酸肌酸激酶</td><td>CK</td><td><input value="'+ins.CK+'" readonly/></td><td>U/L</td><td></td><td>24~184</td></tr>'
		+'		</tbody>'
		+'	</table>'
		+'</div>'
		+'</div>'

	res	+='<div class="row">'
		+'	<div class="col-md-10">'
		+'		<div class="form-group">'
		+'			<label><h3>结果分析</h3></label>'
		+'			<textarea class="form-control" rows="3" readonly>'+ins.analysis+'</textarea>'
		+'		</div>'
		+'		<div class="form-group"><label><h3>附件</h3></label></div>'
		+'		<div class="form-group">';

		ins.attachmentFiles.forEach(function(f){
			res += '<img src="' + f + '" />';
		});

	res	+='		</div>'
		+'	</div>'
		+'</div>';

	return res;
};

var gangongnengInspection = function(ins) {
	if(ins.inspection !== "gangongneng") return "";

	var res = '<div class="row">'
		+'<div class="col-md-8">'
		+'	<label class="col-form-label"><h3>肝功能检测报告</h3></label>'
		+'	<table class="table table-striped">'
		+'		<thead>'
		+'			<th class="col-md-2">测试项目</th>'
		+'			<th class="col-md-1">缩写</th>'
		+'			<th class="col-md-2">结果</th>'
		+'			<th class="col-md-1">单位</th>'
		+'			<th class="col-md-1">提示</th>'
		+'			<th class="col-md-1">参考范围</th>'
		+'		</thead>'
		+'		<tbody>'
		+'			<tr><td>谷草转氨酶</td><td>AST</td><td><input value="'+ins.AST+'" readonly/></td><td>U/L</td><td>H</td><td>15~40</td></tr>'
		+'			<tr><td>谷丙转氨酶</td><td>ALT</td><td><input value="'+ins.ALT+'" readonly/></td><td>U/L</td><td></td><td>3~35</td></tr>'
		+'			<tr><td>谷草/谷丙转氨酶比值</td><td>S/L</td><td><input value="'+ins.SL+'" readonly/></td><td></td><td></td><td>0.91~2.25</td></tr>'
		+'			<tr><td>总蛋白</td><td>TPROT</td><td><input value="'+ins.TPROT+'" readonly/></td><td>g/L</td><td></td><td>61.0~82.0</td></tr>'
		+'			<tr><td>白蛋白</td><td>ALB</td><td><input value="'+ins.ALB+'" readonly/></td><td>g/L</td><td></td><td>36.0~51.0</td></tr>'
		+'			<tr><td>球蛋白</td><td>GLB</td><td><input value="'+ins.GLB+'" readonly/></td><td>g/L</td><td></td><td>25.0~35.0</td></tr>'
		+'			<tr><td>白蛋白/球蛋白</td><td>A/G</td><td><input value="'+ins.AG+'" readonly/></td><td></td><td></td><td>1.2~2.5</td></tr>'
		+'			<tr><td>总胆红素</td><td>TBILI</td><td><input value="'+ins.TBILI+'" readonly/></td><td>umol/L</td><td></td><td>4.0~23.9</td></tr>'
		+'			<tr><td>直接胆红素</td><td>DBILI</td><td><input value="'+ins.DBILI+'" readonly/></td><td>umol/L</td><td></td><td>0~6.8</td></tr>'
		+'			<tr><td>间接胆红素</td><td>IBILI</td><td><input value="'+ins.IBILI+'" readonly/></td><td>umol/L</td><td></td><td>2.6~20.9</td></tr>'
		+'			<tr><td>谷氨酰转肽酶</td><td>GGT</td><td><input value="'+ins.GGT+'" readonly/></td><td>U/L</td><td>H</td><td>10~60</td></tr>'
		+'			<tr><td>总胆汁酸</td><td>TBA</td><td><input value="'+ins.TBA+'" readonly/></td><td>umol/L</td><td></td><td>0~14.0</td></tr>'
		+'			<tr><td>磷</td><td>IPHOS</td><td><input value="'+ins.IPHOS+'" readonly/></td><td>umol/L</td><td></td><td>0.74~1.52</td></tr>'
		+'			<tr><td>尿素氮</td><td>BUN</td><td><input value="'+ins.BUN+'" readonly/></td><td>umol/L</td><td></td><td>2.4~8.2</td></tr>'
		+'			<tr><td>肌酐(酶法)</td><td>CREAT</td><td><input value="'+ins.CREAT+'" readonly/></td><td>umol/L</td><td></td><td>31.8~116.0</td></tr>'
		+'			<tr><td>磷酸肌酸激酶</td><td>CK</td><td><input value="'+ins.CK+'" readonly/></td><td>U/L</td><td></td><td>24~184</td></tr>'
		+'		</tbody>'
		+'	</table>'
		+'</div>'
		+'</div>'

	res	+='<div class="row">'
		+'	<div class="col-md-10">'
		+'		<div class="form-group">'
		+'			<label><h3>结果分析</h3></label>'
		+'			<textarea class="form-control" rows="3" readonly>'+ins.analysis+'</textarea>'
		+'		</div>'
		+'		<div class="form-group"><label><h3>附件</h3></label></div>'
		+'		<div class="form-group">';

		ins.attachmentFiles.forEach(function(f){
			res += '<img src="' + f + '" />';
		});

	res	+='		</div>'
		+'	</div>'
		+'</div>';

	return res;
};

var liangduibanInspection = function(ins) {
	if(ins.inspection !== "liangduiban") return "";

	var res = '<div class="row">'
		+'<div class="col-md-7">'
		+'	<label class="col-form-label"><h3>乙肝五项检测报告</h3></label>'
		+'	<table class="table table-striped">'
		+'		<thead>'
		+'			<th class="col-md-2">测试项目</th>'
		+'			<th class="col-md-1">缩写</th>'
		+'			<th class="col-md-1">检验方法</th>'
		+'			<th class="col-md-2">结果</th>'
		+'			<th class="col-md-1">参考值</th>'
		+'		</thead>'
		+'		<tbody>'
		+'			<tr><td>乙肝表面抗原</td><td>HBsAg</td><td>酶免法</td><td><input value="'+ins.HBsAg+'" readonly/></td><td>阴性</td></tr>'
		+'			<tr><td>乙肝表面抗体</td><td>HBsAb</td><td>酶免法</td><td><input value="'+ins.HBsAb+'" readonly/></td><td>阴性</td></tr>'
		+'			<tr><td>乙肝e抗原</td><td>HBeAg</td><td>酶免法</td><td><input value="'+ins.HBeAg+'" readonly/></td><td>阴性</td></tr>'
		+'			<tr><td>乙肝e抗体</td><td>HBeAb</td><td>酶免法</td><td><input value="'+ins.HBeAb+'" readonly/></td><td>阴性</td></tr>'
		+'			<tr><td>乙肝核心抗体</td><td>HBcAb</td><td>酶免法</td><td><input value="'+ins.HBcAb+'" readonly/></td><td>阴性</td></tr>'
		+'		</tbody>'
		+'	</table>'
		+'</div>'
		+'</div>'

	res	+='<div class="row">'
		+'	<div class="col-md-10">'
		+'		<div class="form-group">'
		+'			<label><h3>结果分析</h3></label>'
		+'			<textarea class="form-control" rows="3" readonly>'+ins.analysis+'</textarea>'
		+'		</div>'
		+'		<div class="form-group"><label><h3>附件</h3></label></div>'
		+'		<div class="form-group">';

		ins.attachmentFiles.forEach(function(f){
			res += '<img src="' + f + '" />';
		});

	res	+='		</div>'
		+'	</div>'
		+'</div>';

	return res;
};
