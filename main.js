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
	res.sendFile(__dirname + '/page/doctor.html');
});



app.get('/gov', function(req, res){
	res.sendFile(__dirname + '/page/gov.html');
});

app.get('/fileEntry/:fileName', function(req, res) {
	console.log('fileEntry get called');
	var fileName = req.params.fileName;
	res.sendFile(__dirname + '/page/' + fileName + '.png');
});

app.post('/acEntry', function(req, res) {
	var accessControlRequest = req.body;
	console.log('acEntry begin');
	console.log(accessControlRequest);
	console.log('acEntry end');
	res.send({
		"TxId" 						: accessControlRequest.TxId,
		"FileId" 					: accessControlRequest.FileId,
		"Success" 					: true,
		"RequestLauncher" 			: accessControlRequest.RequestLauncher,
		"RequestLauncherDepartment" : accessControlRequest.RequestLauncherDepartment,
		"FileEntry" 				: "http://172.18.232.124:8080/fileEntry/pikachu",
		"FileEntryFormat" 			: "REST FileEntryFormat",
		"CacheControl" 				: "REST CacheControl",
		"FileDepartmentSig" 		: "FileDepartmentSig",
		"FileDepartmentPKC"			: "FileDepartmentPKC"
	});
});

const fileUpload = require('express-fileupload');
app.use(fileUpload());

app.post('/upload', function(req, res) {
	console.log('upload begin');
	// console.log(req);
	console.log(req.body.uploadText);
	var testFile = req.files.uploadFile;
	testFile.mv('./medical/' + testFile.name, function(err){
		if(err)
    		return res.status(500).send(err);
	});
	console.log('upload end');
	res.send("upload reply");
});

// var hospital = require("./app/hospital.js");
// var doctor = require("./app/doctor.js");
// var patient = require("./app/patient.js");

var exec = require('child-process-promise').exec;

var department = "department";

var io = require('socket.io')(http);
io.on('connection', function(socket){
	var id = "yeyongjie";

	socket.on('login', function(req){
		console.log(req);
		// id = req.id;
		var pwd = req.pwd;

		var cmd = './medical/getAllFileMetaData.sh';
		console.log(cmd);
		exec(cmd)
			.then((result) => {
				// console.log(result);
				socket.emit('fileList', {files: JSON.parse(result.stdout).FileMetaDatas});
			})
			.catch((err) => {
				console.log(err);
			});
	});
	socket.on('requestFile', function(req){
		var fileId = req.fileId;
		var cmd = './medical/request.sh ' + fileId + ' ' + id + ' ' + department;
		console.log(cmd);
		exec(cmd)
			.then((result) => {
				var fileRequestReply = JSON.parse(result.stdout);
				var entry = fileRequestReply.Entry;
				console.log(entry);
				socket.emit('fileEntry', {entry: entry});
			})
	});
	socket.on('requestFileAuthorization', function(req){
		var cmd = './medical/requestAuthorization.sh ' + req.fileId + ' ' + id + ' ' + department;
		console.log(cmd);
		exec(cmd)
			.then((result) => {
				console.log('./medical/requestAuthorization.sh result: ');
				console.log(result.stdout);
				console.log('./medical/requestAuthorization.sh end');
				var txid = result.stdout;
				cmd = './medical/getAuthorisedRecord.sh ' + txid
				exec(cmd)
					.then((result) => {
						console.log('./medical/getAuthorisedRecord.sh result');
						console.log(result);
						console.log('./medical/getAuthorisedRecord.sh result end');
						var fileEntry = JSON.parse(result.stdout).FileEntry;
						console.log(fileEntry);
						socket.emit('fileEntry', {entry: fileEntry});
					})
			})
	});
	socket.on('searchByName', function(req){
		var name = req.name;
		if(name === "")
			socket.emit('searchResult', {files:[]});
		else {
			var cmd = './medical/searchByName.sh ' + id + ' ' + name;
			exec(cmd)
				.then((result) => {
					// console.log(result);
					socket.emit('searchResult', {files: JSON.parse(result.stdout).FileMetaDatas});
				})
				.catch((err) => {
					console.log(err);
				});
		}
	});
	socket.on('searchByTime', function(req){
		var begin = (new Date(req.begin).valueOf() / 1000).toString();
		var end = (new Date(req.end).valueOf() / 1000).toString();
		var cmd = './medical/searchByTime.sh ' + id + ' ' + begin + ' ' + end;
		console.log(cmd);
		exec(cmd)
			.then((result) => {
				// console.log(result);
				socket.emit('searchResult', {files: JSON.parse(result.stdout).FileMetaDatas});
			})
			.catch((err) => {
				console.log(err);
			});
	});
	socket.on('searchByDepartment', function(req){
		var department = req.department;
		var begin = (new Date(req.begin).valueOf() / 1000).toString();
		var end = (new Date(req.end).valueOf() / 1000).toString();
		var cmd = './medical/searchByDepartmentAndTime.sh ' + id + ' ' + department + ' ' + begin + ' ' + end;
		console.log(cmd);
		exec(cmd)
			.then((result) => {
				// console.log(result);
				socket.emit('searchResult', {files: JSON.parse(result.stdout).FileMetaDatas});
			})
			.catch((err) => {
				console.log(err);
			});
	});
	socket.on('searchByUploader', function(req){
		var uploader = req.uploader;
		var begin = (new Date(req.begin).valueOf() / 1000).toString();
		var end = (new Date(req.end).valueOf() / 1000).toString();
		var cmd = './medical/searchByUploaderAndTime.sh ' + id + ' ' + uploader + ' ' + begin + ' ' + end;
		console.log(cmd);
		exec(cmd)
			.then((result) => {
				// console.log(result);
				socket.emit('searchResult', {files: JSON.parse(result.stdout).FileMetaDatas});
			})
			.catch((err) => {
				console.log(err);
			});
	});
});


// var io = require('socket.io')(http);
// io.on('connection', function(socket){
// 	socket.on('login', function(req){
// 		console.log('login');
// 		console.log(req);
// 		var id = req.id;
// 		var pwd = req.pwd;
// 		myEventListener.myRegisterEventListener('org1', "d1", doctor.doctorHandler, socket);
// 		var cmd = './demo/getDoctorInfo.sh 57528415278297529';
// 		exec(cmd)
// 			.then((result) => {
// 				socket.emit('loginSucess', {doctor: id, hospital: "h1", doctorInfo: result.stdout, patients: "p1\np2\np3"});
// 			})
// 			.catch((err) => {
// 	        	console.error('ERROR: ', err);
// 			});
// 	});
// 	socket.on('getPatientRecords', function(req){
// 		console.log('getPatientRecords');
// 		console.log(req);
// 		var patientInfo = "";
// 		var getPatientRecordsCmd = './demo/getPatientInfo.sh 428471868519595972';
// 		exec(getPatientRecordsCmd).then((result) => {patientInfo = result.stdout;}).catch((err) => {});
// 		var cmd = './demo/getPatientRecord.sh ./demo/doctorPri ' + req.doctor + ' ' + req.hospital
// 						+ ' ' + req.patient + ' ./demo/doctorProf';
// 		console.log(cmd);
// 		exec(cmd)
// 			.then((result) => {
// 				socket.emit('patientRecords', {doctor: req.doctor, hospital: req.hospital, patient: req.patient,
// 						patientInfo: patientInfo, patientRecords: result.stdout});
// 			})
// 			.catch((err) => {
// 	        	console.error('ERROR: ', err);
// 			});
// 	});
// 	socket.on('getRecordDetail', function(req){
// 		console.log('getRecordDetail');
// 		console.log(req);

// 		var cmd = './demo/request.sh ./demo/doctorPri ' + req.doctor + ' ' + req.hospital
// 				+ ' ' + req.patient + ' ' + req.targetHospital + ' ' + req.recordId
// 				+ ' ./demo/doctorProf';
// 		console.log(cmd);
// 		exec(cmd)
// 			.then((result) => {
//                 var txid = result.stdout;
//                 cmd = './demo/getData.sh ' + txid;
//                 exec(cmd)
//                  .then((result) => {
//                      socket.emit('recordDetail', {recordDetail: result.stdout});
//                  })
//                  .catch((err) => {
//                      console.error('ERROR: ', err);
//                  });
// 			})
// 			.catch((err) => {
// 	        	console.error('ERROR: ', err);
// 			});
// 	});
// });

// ============= start server =======================

var server = http.listen(port, function() {
	console.log(`Please open Internet explorer to access ：http://${host}:${port}/`);
	// myEventListener.myRegisterEventListener('org1', "h1", hospital.hospitalHandler, null);
	// myEventListener.myRegisterEventListener('org1', "d1", doctor.doctorHandler);
	// myEventListener.myRegisterEventListener('org1', "patient", patient.patientHandler);
});





