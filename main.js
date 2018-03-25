/**
 *
 * Created by shouhewu on 6/8/17.
 *
 */
var express = require("express");
var path = require('path');
var app = express();
var http= require('http').Server(app);
var bodyParser = require('body-parser');

require('./socket/websocketserver.js')(http)

var timer=require('./timer/timer.js')
// timer.start()


var query=require('./app/query.js');
var ledgerMgr=require('./utils/ledgerMgr.js')

var statusMertics=require('./service/metricservice.js')

var channelsRouter=require('./router/channels.js')

app.use(express.static(path.join(__dirname,'explorer_client')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/apis',channelsRouter)

var query=require('./app/query.js')
var sql=require('./db/mysqlservice.js')

var myEventListener = require('./app/myEventListener.js')

var config = require('./config.json');
var host = process.env.HOST || config.host;
var port = process.env.PORT || config.port;


// =======================   controller  ===================

app.post("/api/tx/getinfo", function(req, res) {

	let  txid = req.body.txid
	if( txid != '0' ){
	query.getTransactionByID('peer1',ledgerMgr.getCurrChannel(),txid,'admin','org1').then(response_payloads=>{

		var header = response_payloads['transactionEnvelope']['payload']['header']
		var data = response_payloads['transactionEnvelope']['payload']['data']
		var signature = response_payloads['transactionEnvelope']['signature'].toString("hex")

		res.send({
			'tx_id':header.channel_header.tx_id,
			'timestamp':header.channel_header.timestamp,
			'channel_id':header.channel_header.channel_id,
			'type':header.channel_header.type,
		})
	})

	}else{
		res.send({ })
	}


});

app.post("/api/tx/json", function(req, res) {

	let  txid = req.body.number
	if( txid != '0' ){
		query.getTransactionByID('peer1',ledgerMgr.getCurrChannel(),txid,'admin','org1').then(response_payloads=>{

			var header = response_payloads['transactionEnvelope']['payload']['header']
			var data = response_payloads['transactionEnvelope']['payload']['data']
			var signature = response_payloads['transactionEnvelope']['signature'].toString("hex")

			var blockjsonstr = JSON.stringify(response_payloads['transactionEnvelope'])

			res.send(blockjsonstr)

		})

	}else{

		res.send({ })

	}

});

app.post("/api/block/json", function(req, res) {

	let number=req.body.number
	query.getBlockByNumber('peer1',ledgerMgr.getCurrChannel(),parseInt(number),'admin','org1').then(block=>{

		var blockjsonstr = JSON.stringify(block)

		res.send(blockjsonstr)
	})
});


app.post("/api/block/getinfo", function(req, res) {

	let number=req.body.number
	query.getBlockByNumber('peer1',ledgerMgr.getCurrChannel(),parseInt(number),'admin','org1').then(block=>{
		res.send({
			'number':block.header.number.toString(),
			'previous_hash':block.header.previous_hash,
			'data_hash':block.header.data_hash,
			'transactions':block.data.data
		})
	})
});

/*app.post("/api/block/get", function(req, res) {
	let number=req.body.number
	query.getBlockByNumber('peer1',ledgerMgr.getCurrChannel(),parseInt(number),'admin','org1').then(block=>{
		res.send({
			'number':number,
			'txCount':block.data.data.length
		})
	})
});*/
app.post("/api/block/get", function(req, res) {
	let number=req.body.number
	sql.getRowByPkOne(`select blocknum ,txcount from blocks where channelname='${ledgerMgr.getCurrChannel()}' and blocknum='${number}'`).then(row=>{
		if(row){
			res.send({
				'number':row.blocknum,
				'txCount':row.txcount
			})
		}
	})

});

//return latest status
app.post("/api/status/get", function(req, res) {
	statusMertics.getStatus(ledgerMgr.getCurrChannel(),function(status){
		res.send(status)
	})
});

app.post('/chaincodelist',function(req,res){
	statusMertics.getTxPerChaincode(ledgerMgr.getCurrChannel(),function (data) {
		res.send(data)
	})
});

app.post('/changeChannel',function(req,res){
	let channelName=req.body.channelName
	ledgerMgr.changeChannel(channelName)
	res.end()
});

app.post('/curChannel',function(req,res){
	res.send({'currentChannel':ledgerMgr.getCurrChannel()})
});

app.post('/channellist',function(req,res){
	res.send({'channelList':ledgerMgr.getChannellist()})
});

app.get('/doctorPage', function(req, res){
	res.sendFile(__dirname + '/page/doctor.html-old');
});

app.get('/doc', function(req, res){
	console.log('/doc');
	res.sendFile(__dirname + '/page/doctor.html');
});

app.get('/patient', function(req, res){
	console.log('/patient')
	res.sendFile(__dirname + '/page/patient.html');
});

app.get('/getDoctorInfo/:id', function(req, res){
	id = req.params.id;
	console.log('/getDoctorInfo/:id ', id);
	res.send({ header: "http://172.18.232.124:8080/header/" + id.toString(),
			name: "yeyongjie",
			phone:"15521132718",
			email:"394566396@qq.com",
			addr:"sysundc"});
});

app.get('/getPatientInfo/:id', function(req, res){
	id = req.params.id;
	console.log('/getPatientInfo/:id ', id);
	res.send({ header: "http://172.18.232.124:8080/header/" + id.toString(),
			name: "patientYe",
			phone:"15521132718",
			email:"sysuyyj@qq.com",
			addr:"sysundc"});
});

app.get('/getDoctorsPatients/:id', function(req, res){
	id = req.params.id;
	console.log('/getDoctorsPatients/:id ', id);
	res.send({patients: [{name: "patient1", id:1},
			{name: "patient2", id:2}, {name: "patient3", id:3}]});
});

app.get('/header/:id', function(req, res){
	id = req.params.id;
	console.log('/header/:id ', id);
	res.send("header");
});

// app.get('/gov', function(req, res){
// 	res.sendFile(__dirname + '/page/gov.html');
// });

// app.get('/fileEntry/:fileName', function(req, res) {
// 	console.log('fileEntry get called');
// 	var fileName = req.params.fileName;
// 	res.sendFile(__dirname + '/page/' + fileName + '.png');
// });

// app.post('/acEntry', function(req, res) {
// 	var accessControlRequest = req.body;
// 	console.log('acEntry begin');
// 	console.log(accessControlRequest);
// 	console.log('acEntry end');
// 	res.send({
// 		"TxId" 						: accessControlRequest.TxId,
// 		"FileId" 					: accessControlRequest.FileId,
// 		"Success" 					: true,
// 		"RequestLauncher" 			: accessControlRequest.RequestLauncher,
// 		"RequestLauncherDepartment" : accessControlRequest.RequestLauncherDepartment,
// 		"FileEntry" 				: "http://172.18.232.124:8080/fileEntry/pikachu",
// 		"FileEntryFormat" 			: "REST FileEntryFormat",
// 		"CacheControl" 				: "REST CacheControl",
// 		"FileDepartmentSig" 		: "FileDepartmentSig",
// 		"FileDepartmentPKC"			: "FileDepartmentPKC"
// 	});
// });

const fileUpload = require('express-fileupload');
app.use(fileUpload());

// app.post('/upload', function(req, res) {
// 	console.log('upload begin');
// 	// console.log(req);
// 	console.log(req.body.uploadText);
// 	var testFile = req.files.uploadFile;
// 	testFile.mv('./medical/' + testFile.name, function(err){
// 		if(err)
//     		return res.status(500).send(err);
// 	});
// 	console.log('upload end');
// 	res.send("upload reply");
// });

// var hospital = require("./app/hospital.js");
// var doctor = require("./app/doctor.js");
// var patient = require("./app/patient.js");

var exec = require('child-process-promise').exec;
var asyncExec = function(cmd, callback) {
	console.log(asyncExec, cmd);
	exec(cmd)
		.then((result) => {
			callback(result);
		})
		.catch((err) => {
			console.error('ERROR: ', err);
		});
};

var hospital = config.hospital;

var io = require('socket.io')(http);
io.on('connection', function(socket){

	/*
	*	For both patient and doctor
	*/
	socket.on('signup', function(req) {
		var role = req.role;
		var id = req.id;
		var name = req.name;
		var pwd = req.pwd;
		var phone = req.phone;
		var email = req.email;
		var addr = req.addr;
		console.log('signup', [role, id, name, pwd, phone, email, addr]);
		// TODO: do some database works
		// TODO: generate prikey and pkc
		var prikey = "prikey";
		var pkc = "pkc";
		socket.emit('signUpSuccess', {role: role, id: id, name: name, prikey: prikey, pkc: pkc});
	});
	socket.on('signupState', function(req) {
		var role = req.role;
		var id = req.id;
		var name = "yeyongjie";
		console.log('signupState', [role, id]);
		var prikey = "prikey";
		var pkc = "pkc";
		socket.emit('signUpSuccess', {role: role, id: id, name: name, prikey: prikey, pkc: pkc});
	});


	/*
	*	For Patient
	*/
	socket.on('register', function(req){
		var id = req.id;
		var keshi = req.keshi;
		var doctor = req.doctor;
		var time = req.time;
		var sig = req.sig;
		var pkc = req.pkc;
		console.log('patient register', [id, keshi, doctor, time, sig, pkc]);
		socket.emit('onRegister', {msg: "Please go to room 431"});
	});
	socket.on('deRegister', function(req){
		var id = req.id;
		var time = req.time;
		var sig = req.sig;
		var pkc = req.pkc;
		console.log('patient deRegister', [id, time, sig, pkc]);
	});


	/*
	*	For Doctor
	*/

	socket.on('login', function(req){
		var id = req.id;
		var pwd = req.pwd;
		console.log('login', [id, pwd]);
		// myEventListener.myRegisterEventListener('org1', "d1", doctor.doctorHandler, socket);
		var cmd = './bishe/getDoctorInfo.sh ' + id;
		console.log(cmd);
		asyncExec(cmd, function(result){
			console.log('./bishe/getDoctorInfo.sh result: ', result.stdout);
			socket.emit('doctorInfo', {id: id, hospital: hospital, doctorInfo: result.stdout});
		})
		cmd = './bishe/getDoctorsPatients.sh ' + id;
		console.log(cmd);
		asyncExec(cmd, function(result){
			console.log('./bishe/getDoctorsPatients.sh result: ', result.stdout);
			socket.emit('doctorPatients', {id: id, patients: JSON.parse(result.stdout).patients});
		});
	});

	socket.on('getPatientRecords', function(req){
		var doctorId = req.doctorId;
		var patientId = req.patientId;
		console.log('getPatientRecords', [doctorId, patientId]);
		var cmd = './bishe/getPatientInfo.sh ' + patientId;
		console.log(cmd);
		asyncExec(cmd, function(result){
			console.log('./bishe/getPatientInfo.sh result: ', result.stdout);
			socket.emit('patientInfo', {id: patientId, hospital: hospital, patientInfo: result.stdout});
		})
		var end = Math.floor(new Date() / 1000);
		cmd = './bishe/getPatientRecords.sh ' + doctorId + ' ' + hospital + ' ' + patientId + ' 0 ' + end.toString();
		asyncExec(cmd, function(result) {
			console.log('./bishe/getPatientRecords.sh result: ', result.stdout);
			socket.emit('patientRecords', {id: patientId, records: JSON.parse(result.stdout).Records});
		});
	});
	socket.on('requestDetail', function(req){
		var rid = req.rid;
		var did = req.did;
		var pid = req.pid;
		var targetHospital = req.targetHospital;
		console.log('requestDetail', [rid, did, pid, targetHospital]);
		var cmd = ['./bishe/requestDetail.sh', did, hospital, pid, targetHospital, rid].join(' ');
		asyncExec(cmd, function(result) {
			console.log(cmd, result.stdout);
		});
	});

});

// ============= start server =======================

var server = http.listen(port, function() {
	console.log(`Please open Internet explorer to access ：http://${host}:${port}/`);
	// myEventListener.myRegisterEventListener('org1', "h1", hospital.hospitalHandler, null);
	// myEventListener.myRegisterEventListener('org1', "d1", doctor.doctorHandler);
	// myEventListener.myRegisterEventListener('org1', "patient", patient.patientHandler);
});





