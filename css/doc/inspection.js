var patientInspection = new Map;

var showInspections = function(pid) {
	console.log("showInspections", pid, patientInspection[pid]);
	var inspections = patientInspection[pid];
	var res = "";
	if(!inspections) return res;
	inspections.forEach(function(ins){
		res += buildInspection(ins.detail);
	});
	// return res;
	document.getElementById("diagnose-inspection").innerHTML = res;
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
		+'<div class="col-md-12">'
		+'	<label class="col-form-label"><h3>血常规检测报告</h3></label>'
		+'	<table class="table table-striped">'
		+'		<thead>'
		+'			<th>测试项目</th>'
		+'			<th>缩写</th>'
		+'			<th>结果</th>'
		+'			<th>单位</th>'
		+'			<th nowrap>提示</th>'
		+'			<th>参考范围</th>'
		+'		</thead>'
		+'		<tbody>'
		+'			<tr><td nowrap>谷草转氨酶</td><td>AST</td><td><input value="'+ins.AST+'" readonly/></td><td>U/L</td><td>H</td><td>15~40</td></tr>'
		+'			<tr><td nowrap>谷丙转氨酶</td><td>ALT</td><td><input value="'+ins.ALT+'" readonly/></td><td>U/L</td><td></td><td>3~35</td></tr>'
		+'			<tr><td nowrap>谷草/谷丙转氨酶比值</td><td>S/L</td><td><input value="'+ins.SL+'" readonly/></td><td></td><td></td><td>0.91~2.25</td></tr>'
		+'			<tr><td nowrap>总蛋白</td><td>TPROT</td><td><input value="'+ins.TPROT+'" readonly/></td><td>g/L</td><td></td><td>61.0~82.0</td></tr>'
		+'			<tr><td nowrap>白蛋白</td><td>ALB</td><td><input value="'+ins.ALB+'" readonly/></td><td>g/L</td><td></td><td>36.0~51.0</td></tr>'
		+'			<tr><td nowrap>球蛋白</td><td>GLB</td><td><input value="'+ins.GLB+'" readonly/></td><td>g/L</td><td></td><td>25.0~35.0</td></tr>'
		+'			<tr><td nowrap>白蛋白/球蛋白</td><td>A/G</td><td><input value="'+ins.AG+'" readonly/></td><td></td><td></td><td>1.2~2.5</td></tr>'
		+'			<tr><td nowrap>总胆红素</td><td>TBILI</td><td><input value="'+ins.TBILI+'" readonly/></td><td>umol/L</td><td></td><td>4.0~23.9</td></tr>'
		+'			<tr><td nowrap>直接胆红素</td><td>DBILI</td><td><input value="'+ins.DBILI+'" readonly/></td><td>umol/L</td><td></td><td>0~6.8</td></tr>'
		+'			<tr><td nowrap>间接胆红素</td><td>IBILI</td><td><input value="'+ins.IBILI+'" readonly/></td><td>umol/L</td><td></td><td>2.6~20.9</td></tr>'
		+'			<tr><td nowrap>谷氨酰转肽酶</td><td>GGT</td><td><input value="'+ins.GGT+'" readonly/></td><td>U/L</td><td>H</td><td>10~60</td></tr>'
		+'			<tr><td nowrap>总胆汁酸</td><td>TBA</td><td><input value="'+ins.TBA+'" readonly/></td><td>umol/L</td><td></td><td>0~14.0</td></tr>'
		+'			<tr><td nowrap>磷</td><td>IPHOS</td><td><input value="'+ins.IPHOS+'" readonly/></td><td>umol/L</td><td></td><td>0.74~1.52</td></tr>'
		+'			<tr><td nowrap>尿素氮</td><td>BUN</td><td><input value="'+ins.BUN+'" readonly/></td><td>umol/L</td><td></td><td>2.4~8.2</td></tr>'
		+'			<tr><td nowrap>肌酐(酶法)</td><td>CREAT</td><td><input value="'+ins.CREAT+'" readonly/></td><td>umol/L</td><td></td><td>31.8~116.0</td></tr>'
		+'			<tr><td nowrap>磷酸肌酸激酶</td><td>CK</td><td><input value="'+ins.CK+'" readonly/></td><td>U/L</td><td></td><td>24~184</td></tr>'
		+'			<tr><td></br></td><td></td><td></td><td></td><td></td><td></td></tr>'
		+'			<tr><td nowrap>备注</td><td colspan="5">'+ins.analysis+'</td></tr>'
		+'		</tbody>'
		+'	</table>'
		+'</div>'
		+'</div>'

		res +='<div class="row">'
		+'	<div class="col-md-12">'
		+'		<div class="form-group"><label><h3>附件</h3></label></div>'
		+'		<div class="form-group">';

		ins.attachmentFiles.forEach(function(f){
			res += '<img src="' + f + '" class="img-responsive"/>';
		});

	res	+='		</div>'
		+'	</div>'
		+'</div>';

	return res;
};

var gangongnengInspection = function(ins) {
	if(ins.inspection !== "gangongneng") return "";

	var res = '<div class="row">'
		+'<div class="col-md-12">'
		+'	<label class="col-form-label"><h3>肝功能检测报告</h3></label>'
		+'	<table class="table table-striped">'
		+'		<thead>'
		+'			<th>测试项目</th>'
		+'			<th>缩写</th>'
		+'			<th>结果</th>'
		+'			<th>单位</th>'
		+'			<th>提示</th>'
		+'			<th>参考范围</th>'
		+'		</thead>'
		+'		<tbody>'
		+'			<tr><td nowrap>丙氨酸氨基转移酶</td><td>ALT</td><td><input readonly value="'+ins.ALT+'" /></td><td>U/L</td><td>阳性</td><td>0~40</td></tr>'
		+'			<tr><td nowrap>天门冬氨酸氨基转移酶</td><td>AST</td><td><input readonly value="'+ins.AST+'" /></td><td>U/L</td><td>阴性</td><td>0~40</td></tr>'
		+'			<tr><td nowrap>转氨酶比</td><td>AST:ALT</td><td><input readonly value="'+ins.AA+'" /></td><td></td><td></td><td>0.6~1.5</td></tr>'
		+'			<tr><td nowrap>总胆红素</td><td>TBIL</td><td><input readonly value="'+ins.TBIL+'" /></td><td>umol/L</td><td>阴性</td><td>1.71~17.1</td></tr>'
		+'			<tr><td nowrap>直接胆红素</td><td>DBIL</td><td><input readonly value="'+ins.DBIL+'" /></td><td>umol/L</td><td>阴性</td><td>0.51~3.24</td></tr>'
		+'			<tr><td nowrap>间接胆红素</td><td>IBIL</td><td><input readonly value="'+ins.IBIL+'" /></td><td>umol/L</td><td>阴性</td><td>1.71~13.8</td></tr>'
		+'			<tr><td nowrap>乙肝表面抗原</td><td>HBsAg</td><td><input readonly value="'+ins.HBsAg+'" /></td><td></td><td>阴性</td><td></td></tr>'
		+'			<tr><td nowrap>葡萄糖</td><td>GLU</td><td><input readonly value="'+ins.GLU+'" /></td><td>mmol/L</td><td></td><td>3.6~6.1</td></tr>'
		+'			<tr><td nowrap>球蛋白</td><td>GLO</td><td><input readonly value="'+ins.GLO+'" /></td><td>g/L</td><td></td><td>23~30</td></tr>'
		+'			<tr><td nowrap>白球比</td><td>A/G</td><td><input readonly value="'+ins.AG+'" /></td><td></td><td></td><td>1.5~2.5</td></tr>'
		+'			<tr><td nowrap>a-L-岩藻糖苷酶</td><td>AFU</td><td><input readonly value="'+ins.AFU+'" /></td><td>nKat/L</td><td></td><td>52~170</td></tr>'
		+'			<tr><td><br/></td><td></td><td></td><td></td><td></td><td></td></tr>'
		+'			<tr><td nowrap>备注</td><td colspan="5">'+ins.analysis+'</td></tr>'
		+'		</tbody>'
		+'	</table>'
		+'</div>'
		+'</div>'

	res	+='<div class="row">'
		+'	<div class="col-md-12">'
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
		+'<div class="col-md-12">'
		+'	<label class="col-form-label"><h3>乙肝五项检测报告</h3></label>'
		+'	<table class="table table-striped">'
		+'		<thead>'
		+'			<th>测试项目</th>'
		+'			<th>缩写</th>'
		+'			<th>检验方法</th>'
		+'			<th>结果</th>'
		+'			<th>参考值</th>'
		+'		</thead>'
		+'		<tbody>'
		+'			<tr><td nowrap>乙肝表面抗原</td><td>HBsAg</td><td>酶免法</td><td><input value="'+ins.HBsAg+'" readonly/></td><td>阴性</td></tr>'
		+'			<tr><td nowrap>乙肝表面抗体</td><td>HBsAb</td><td>酶免法</td><td><input value="'+ins.HBsAb+'" readonly/></td><td>阴性</td></tr>'
		+'			<tr><td nowrap>乙肝e抗原</td><td>HBeAg</td><td>酶免法</td><td><input value="'+ins.HBeAg+'" readonly/></td><td>阴性</td></tr>'
		+'			<tr><td nowrap>乙肝e抗体</td><td>HBeAb</td><td>酶免法</td><td><input value="'+ins.HBeAb+'" readonly/></td><td>阴性</td></tr>'
		+'			<tr><td nowrap>乙肝核心抗体</td><td>HBcAb</td><td>酶免法</td><td><input value="'+ins.HBcAb+'" readonly/></td><td>阴性</td></tr>'
		+'			<tr><td></br></td><td></td><td></td><td></td><td></td><td></td></tr>'
		+'			<tr><td nowrap>备注</td><td colspan="4">'+ins.analysis+'</td></tr>'
		+'		</tbody>'
		+'	</table>'
		+'</div>'
		+'</div>'

	res	+='<div class="row">'
		+'	<div class="col-md-12">'
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
