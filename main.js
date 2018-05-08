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
var util = require('util');
require('./socket/websocketserver.js')(http)

var timer=require('./timer/timer.js')

var query=require('./app/query.js');
var ledgerMgr=require('./utils/ledgerMgr.js')

var statusMertics=require('./service/metricservice.js')

var channelsRouter=require('./router/channels.js')


app.use(express.static('css'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/apis',channelsRouter)

var query=require('./app/query.js')
var sql=require('./db/mysqlservice.js')

var myEventListener = require('./app/myEventListener.js')

// var config = require('./config.json');
var host = process.env.HOST;
var port = process.env.PORT;
var hospital = process.env.HOSPITAL;
var hospitalName = process.env.HNAME;
var dbname = process.env.DBNAME;

console.log([host, port, hospital, hospitalName, dbname]);


var mongo = require('mongodb')
var MongoClient = mongo.MongoClient;
var MongoURL = "mongodb://localhost:27017/";


const cp = require('child_process')

function exec(command, options = { log: false, cwd: process.cwd() }) {
  if (options.log) console.log(command)

  return new Promise((done, failed) => {
    cp.exec(command, { ...options }, (err, stdout, stderr) => {
      if (err) {
        err.stdout = stdout
        err.stderr = stderr
        failed(err)
        return
      }

      done({ stdout, stderr })
    })
  })
}



var execOld = require('child-process-promise').exec;
var asyncExec = function(cmd, callback) {
	// console.log(asyncExec, cmd);
	execOld(cmd)
		.then((result) => {
			callback(result);
		})
		.catch((err) => {
			console.error('ERROR: ', err);
		});
};




var doctorSocket = new Map;
var patientSocket = new Map;

var jianyanke = [];

var patientsNotRegister = [];

var eventWatcher = [];

var currentBlock;
var latestBlock = [];

app.get('/bc', function(req, res){
	// console.log('/bc');
	res.sendFile(__dirname + '/page/bc.html');
});

app.get('/doc', function(req, res){
	// console.log('/doc');
	res.sendFile(__dirname + '/page/doc.html');
});

app.get('/patient', function(req, res){
	// console.log('/patient')
	res.sendFile(__dirname + '/page/patient.html');
});

app.get('/jianyanke', function(req, res){
	res.sendFile(__dirname + '/page/jianyanke.html');
});

app.get('/blockchain', function(req, res){
	// console.log('/blockchain')
	res.sendFile(__dirname + '/page/blockchain.html');
});


app.get('/getHospitalName', function(req, res){
	res.send(hospitalName);
});


const asyncMiddlewareThreeArgs = fn =>
	(req, res, next) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};

const asyncMiddlewareOneArgs = fn =>
	(req) => {
		Promise.resolve(fn(req)).catch();
	};



async function getDoctorInfo(did) {
	var db = await MongoClient.connect(MongoURL);
	var res = await db.db(dbname).collection("doctor").findOne({id: did}, {header: 0, prikey: 0, pkc: 0, _id: 0});
	return res;
};

app.get('/getDoctorInfo/:id', asyncMiddlewareThreeArgs(async function(req, res, next) {
	var id = req.params.id;
	console.log('[getDoctorInfo] id: ', id);
	var doctorInfo = await getDoctorInfo(id);
	res.send(doctorInfo);
}));



async function getPatientInfo(pid) {
	var db = await MongoClient.connect(MongoURL);
	var res = await db.db("patient").collection("patient").findOne({id: pid}, {header: 0, prikey: 0, pkc: 0, _id: 0});
	return res;
};

app.get('/getPatientInfo/:id', asyncMiddlewareThreeArgs(async function(req, res, next) {
	var id = req.params.id;
	console.log('[getPatientInfo] id: ', id);
	var patientInfo = await getPatientInfo(id);
	res.send(patientInfo);
}));




async function getDoctorsPatients(did) {
	var db = await MongoClient.connect(MongoURL);
	var result = await db.db(dbname).collection("doctor_patients")
						.find({did: did}, {_id: 0}).toArray();
	console.log("[getDoctorsPatients] result: ", result);
	return result;
}

app.get('/getDoctorsPatients/:id', asyncMiddlewareThreeArgs(async function(req, res, next){
	var id = req.params.id;
	console.log('[getDoctorsPatients] id: ', id);
	var doctorPatients = await getDoctorsPatients(id);
	res.send({patients: doctorPatients});
}));



function doGetHeader(req, res) {
	id = req.params.id;
	res.sendFile(__dirname + '/header/' + id + '.png');
};

app.get('/header/:id', doGetHeader);



const timeout = ms => new Promise(res => setTimeout(res, ms));

async function doRequestDetail(req, res, next) {
	var txid = req.params.txid;
	console.log('[requestDetail] txid: ', txid);

	var db = await MongoClient.connect(MongoURL);
	var index = await db.db(dbname).collection("index").findOne({txid: txid});
	if(!index) {
		console.log("[doRequestDetail] index not exists, txid: ", txid);
		await timeout(5000);
		doRequestDetail(req, res, next);
	}
	var rid = index.rid;
	console.log("[doRequestDetail] rid: ", rid);
	var detail = await db.db(dbname).collection("data").findOne({rid: rid});
	console.log("[doRequestDetail] detail before: ", detail);

		var jianyan = [];
		var jianyanIds = detail.jianyanIds;
		if(jianyanIds) {
			// for(var i = 0; i < jianyanIds.length; i++) {
				// var jianyanId = jianyanIds[i];
				var jianyanId = jianyanIds;
				var ins = await db.db(dbname).collection("jianyan").findOne({'_id': new mongo.ObjectID(jianyanId)});
				jianyan.push(ins);
			// }
		}
		detail.jianyan = JSON.stringify(jianyan);

	console.log("[doRequestDetail] detail after: ", detail);

	res.send(detail);
}

app.get('/requestDetail/:txid', asyncMiddlewareThreeArgs(doRequestDetail));



app.get('/file/:fileName', function(req, res){
	var fileName = req.params.fileName;
	res.sendFile(__dirname + '/file/' + fileName);
});



const fileUpload = require('express-fileupload');
app.use(fileUpload());

app.post('/upload', asyncMiddlewareThreeArgs(async function(req, res){

	var currentTime = Math.floor(new Date() / 1000).toString();
	var did = req.body.did;
	var dname = req.body.dname;
	var pid = req.body.pid;
	var pname = req.body.pname;
	var recordId = [currentTime, did, pid].join("-");

	var data = req.body;
	data.rid = recordId;
	data.files = null;
	data.attachmentFiles = [];

	if(req.files) {
		if(util.isArray(req.files.attachmentFiles)) {
			var files = req.files.attachmentFiles;
			for(var i = 0; i < files.length; i++) {
				var filename = [recordId, i.toString(), files[i].name].join('$$');
				data.attachmentFiles[i] = "http://172.18.232.124:" + port + "/file/" + filename;
				files[i].mv('./file/'+filename,  function(err){
					if(err)
						return res.status(500).send(err);
				});
			}
		}
		else {
			var file = req.files.attachmentFiles;
			var filename = [recordId, "0", file.name].join('_');
			data.attachmentFiles[0] = "http://172.18.232.124:" + port + "/file/" + filename;
			file.mv('./file/'+filename,  function(err){
				if(err)
					return res.status(500).send(err);
			});
		}
	}

	var db = await MongoClient.connect(MongoURL);
	db.db(dbname).collection("data").insertOne(data);

	var cmd = ['./bishe/newRecord.sh', hospital, hospitalName,
					did, dname, pid, pname, data.zhenduan, data.jianyanNames].join(' ');
	var execResult = await exec(cmd);
	var txid = execResult.stdout;
	var chaincodeIdToRidRecord = {rid: recordId, chaincodeId: txid};
	db.db(dbname).collection("chaincodeIdToRid").insertOne(chaincodeIdToRidRecord);

	res.send("upload file success");
}));



app.post('/jianyankeUpload', asyncMiddlewareThreeArgs(async function(req, res, next){

	var currentTime = Math.floor(new Date() / 1000).toString();

	var data = req.body;
	data.files = null;
	data.attachmentFiles = [];

	if(req.files) {
		// console.log(req.files);
		if(util.isArray(req.files.attachmentFiles)) {
			req.files.attachmentFiles.forEach(function(file, i){
				var filename = [currentTime, i.toString(), file.name].join('$$');
				data.attachmentFiles[i] = "http://172.18.232.124:" + port + "/file/" + filename;
				file.mv('./file/'+filename,  function(err){
					if(err)
						return res.status(500).send(err);
				});
			});
		}
		else {
			var file = req.files.attachmentFiles;
			var filename = [currentTime, "0", file.name].join('_');
			data.attachmentFiles[0] = "http://172.18.232.124:" + port + "/file/" + filename;
			file.mv('./file/'+filename,  function(err){
				if(err)
					return res.status(500).send(err);
			});
		}
	}

	var db = await MongoClient.connect(MongoURL);
	var doc = await db.db(dbname).collection("jianyan").insertOne(data);

	var jianyanId = doc.ops[0]._id;
	data.jianyanId = jianyanId;

	var did = data.did;
	if(doctorSocket[did]) {
		doctorSocket[did].emit("newInspection", {data: data});
	}

	var pid = data.pid;
	if(patientSocket[pid]) {
		patientSocket[pid].emit("newInspection", {data: data});
	}

	res.send("upload file success");
}));




var io = require('socket.io')(http);
io.on('connection', function(socket){

	/*
	*	For event watcher
	*/
	socket.on('watch', function(req) {
		eventWatcher.push(socket);
		latestBlock[eventWatcher.length - 1] = currentBlock;
		socket.emit('newBlock', {block: latestBlock});
	});

	/*
	*	For both patient and doctor
	*/
	// socket.on('signup', function(req) {
	// 	var role = req.role;
	// 	var id = req.id;
	// 	var name = req.name;
	// 	var pwd = req.pwd;
	// 	var phone = req.phone;
	// 	var email = req.email;
	// 	var addr = req.addr;
	// 	console.log('signup', [role, id, name, pwd, phone, email, addr]);

	// 	if(role === "patient") {
	// 		MongoClient.connect(MongoURL, function(err, db) {
	// 			if (err) throw err;
	// 			var dbo = db.db("patient");
	// 			dbo.collection("patient").insertOne({id: id, name: name, pwd: pwd, phone: phone, email: email, addr: addr},
	// 				function(err, res) {
	// 				if (err) throw err;
	// 				console.log("insert into mongodb [patient] success");
	// 				db.close();
	// 				var cmd = '../pki/generateKeyAndCsr.sh ' + id;
	// 				asyncExec(cmd, function(result){
	// 					console.log("signUpSuccess ", result);
	// 					socket.emit('signUpSuccess', {role: role, id: id, name: name});
	// 				});
	// 			});
	// 		});
	// 	}

	// });



	/*
	*	For Patient
	*/
	async function getWorkingDoctors() {
		var db = await MongoClient.connect(MongoURL);
		var workingDoctors = await db.db(dbname).collection("working_doctor").find().toArray();
		return workingDoctors;
	}

	socket.on('newPatient', asyncMiddlewareOneArgs(async function(req){
		patientsNotRegister.push(socket);
		var workingDoctors = await getWorkingDoctors();
		socket.emit('doctors', {doctors: workingDoctors, hname: hospitalName});
	}));

	async function notifyJianyankeForNewPatient(patient) {
		jianyanke.forEach(function(socket){
			if(!socket || typeof socket == undefined) return;
			socket.emit('patients', {patients:[patient]});
		});
	}

	socket.on('register', asyncMiddlewareOneArgs(async function(req){
		var pid = req.pid;
		var did = req.did;
		var time = req.time;
		var sig = req.sig;
		var pkc = req.pkc;

		patientSocket[pid] = socket;
		eventWatcher.push(socket);

		var patientInfo = await getPatientInfo(pid);
		socket.emit('patientInfo', {patientInfo: patientInfo});

		var doctorInfo = await getDoctorInfo(did);
		socket.emit('doctorInfo', {did: did, hospitalName: hospitalName, doctorInfo: doctorInfo});

		var db = await MongoClient.connect(MongoURL);
		db.db(dbname).collection("doctor_patients")
				.insertOne({did: did, dname: doctorInfo.name,
							pid: pid, pname: patientInfo.name,
							keshi: doctorInfo.keshi, registerTime: time,
							status: "onRegistered"});

		var cmd = ['./bishe/register.sh', pid, did, hospital].join(' ');
		await exec(cmd);
		var index = patientsNotRegister.indexOf(socket);
		if (index > -1) {
			patientsNotRegister.splice(index, 1);
		}

		notifyJianyankeForNewPatient({pid: pid, pname: patientInfo.name,
										did: did, dname: doctorInfo.name,
										keshi: doctorInfo.keshi, registerTime: time})
	}));


	socket.on('deRegister', asyncMiddlewareOneArgs(async function(req){
		var pid = req.id;
		var did = req.did;
		var time = req.time;
		var sig = req.sig;
		var pkc = req.pkc;

		var cmd = ['./bishe/deRegister.sh', pid, did, hospital].join(' ');
		await exec(cmd);

		var db = await MongoClient.connect(MongoURL);
		db.db(dbname).collection("doctor_patients")
				.updateOne({did: did, pid: pid},
							{$set: {status: "deRegistered", deRegisterTime: time}});

		delete patientSocket[pid];
		jianyanke.forEach(function(socket){
			if(!socket || typeof socket == undefined) return;
			socket.emit('deRegister', {pid: pid});
		});
	}));

	// socket.on('getPatientSelfRecords', asyncMiddlewareOneArgs(async function(req){
	// 	var pid = req.pid;
	// 	var end = Math.floor(new Date() / 1000);

	// 	cmd = './bishe/getPatientRecords.sh ' + did + ' ' + hospital + ' ' + pid + ' 0 ' + end.toString();
	// 	console.log("socket.on getPatientRecords cmd: ", cmd);
	// 	execResult = await exec(cmd);

	// 	var patientRecords = JSON.parse(execResult.stdout).Records;
	// 	console.log("[socket.on getPatientSelfRecords] patientRecords: ", patientRecords);

	// 	socket.emit('patientRecords', {id: pid, records: patientRecords});
	// }));



	/*
	*	For jianyanke
	*/
	socket.on('jianyanke', asyncMiddlewareOneArgs(async function(req){
		jianyanke.push(socket);

		var db = await MongoClient.connect(MongoURL);
		var patients = await db.db(dbname).collection("doctor_patients")
						.find({status: "onRegistered"}, {_id: 0}).toArray();
		socket.emit('patients', {patients: patients});
	}));



	/*
	*	For Doctor
	*/

	async function newWorkingDoctor(doctorInfo) {
		var time = Math.floor(new Date() / 1000).toString();
		var db = await MongoClient.connect(MongoURL);
		var mongoRes = db.db(dbname).collection("working_doctor")
			.insertOne({did: doctorInfo.id, dname: doctorInfo.name, keshi: doctorInfo.keshi, time: time});
		return mongoRes;
	}


	socket.on('login', asyncMiddlewareOneArgs(async function(req){
		var id = req.id;
		var pwd = req.pwd;
		doctorSocket[id] = socket;
		eventWatcher.push(socket);

		var doctorInfo = await getDoctorInfo(id);
		socket.emit('doctorInfo', {id: id, hospitalName: hospitalName, doctorInfo: doctorInfo});

		if(req.isJianyanke) {
			console.log("socket.on doc login isJianyanke id: ", id);
			return;
		}

		await newWorkingDoctor(doctorInfo);

		for(var i = 0; i < patientsNotRegister.length; i++) {
			patientsNotRegister[i].emit("newWorkingDoctor",
					{doctor: {did: id, dname: doctorInfo.name, keshi: doctorInfo.keshi}});
		}

		var doctorPatients = await getDoctorsPatients(id);
		socket.emit('patients', {id: id, patients: doctorPatients});
	}));


	socket.on("doctorLogout", asyncMiddlewareOneArgs(async function(req) {
		var did = req.did;
		delete doctorSocket[did];

		for(var i = 0; i < patientsNotRegister.length; i++) {
			patientsNotRegister[i].emit("doctorLogout", {did: did});
		}

		var db = await MongoClient.connect(MongoURL);
		await db.db(dbname).collection("working_doctor")
				.deleteOne({did: did});
	}));


	socket.on('getPatientRecords', asyncMiddlewareOneArgs(async function(req){
		var did = req.did;
		var pid = req.pid;

		var patientInfo = await getPatientInfo(pid);
		socket.emit('patientInfo', {id: pid, hospital: hospital, patientInfo: patientInfo});

		var end = Math.floor(new Date() / 1000);
		cmd = './bishe/getPatientRecords.sh ' + did + ' ' + hospital + ' ' + pid + ' 0 ' + end.toString();
		console.log("socket.on getPatientRecords cmd: ", cmd);
		execResult = await exec(cmd);
		var patientRecords = JSON.parse(execResult.stdout).Records;
		console.log("[socket.on getPatientRecords] patientRecords: ", patientRecords);

		socket.emit('patientRecords', {id: pid, records: patientRecords});
	}));

	function getHospitalIpPort(hid) {
		if(hid == 1)
			return "http://172.18.232.124:8080";
		else if(hid == 2)
			return "http://172.18.232.124:8181";
	}

	socket.on('requestDetail', asyncMiddlewareOneArgs(async function(req){
		var rid = req.rid;
		var did = req.did;
		var pid = req.pid;
		var targetHospital = req.targetHospital;
		console.log('requestDetail', [rid, did, pid, targetHospital]);
		var cmd = ['./bishe/requestDetail.sh', did, hospital, pid, targetHospital, rid].join(' ');

		var execResult = await exec(cmd);
		if(execResult.stdout.indexOf(' ') >= 0) {
			console.log('requestDetail failed');
			return;
		}

		var txid = execResult.stdout;

		var targetHospitalIpPort = getHospitalIpPort(targetHospital);

		cmd = 'curl -sS ' + targetHospitalIpPort + '/requestDetail/' + txid;
		execResult = await exec(cmd);
		var recordDetail = execResult.stdout;
		console.log("[socket.on requestDetail] recordDetail : ", recordDetail);

		socket.emit('recordDetail', {did: did, pid:pid, txid: txid,
			rid: rid, targetHospital: targetHospital, recordDetail: recordDetail});
	}));



	socket.on('search-time', function(req) {
		console.log("search-time", [req.type, req.begin, req.end]);
		var cmd = ['./bishe/searchTime.sh', req.type, req.begin, req.end].join(' ');
		asyncExec(cmd, function(result){
			console.log(result.stdout);
			socket.emit('search-time', {type: req.type, result: result.stdout});
		});
	});
	socket.on('search-patient', function(req) {
		console.log("search-patient", [req.patient, req.type, req.begin, req.end]);
		var cmd = ['./bishe/searchPatient.sh', req.patient, req.type, req.begin, req.end].join(' ');
		asyncExec(cmd, function(result){
			console.log(result.stdout);
			socket.emit('search-patient', {type: req.type, result: result.stdout});
		});
	});
	socket.on('search-doctor', function(req) {
		console.log("search-doctor", [req.doctor, req.type, req.begin, req.end]);
		var cmd = ['./bishe/searchDoctor.sh', req.doctor, req.type, req.begin, req.end].join(' ');
		asyncExec(cmd, function(result){
			console.log(result.stdout);
			socket.emit('search-doctor', {type: req.type, result: result.stdout});
		});
	});
	socket.on('search-hospital', function(req) {
		console.log("search-hospital", [req.hospital, req.type, req.begin, req.end]);
		var cmd = ['./bishe/searchHospital.sh', req.hospital, req.type, req.begin, req.end].join(' ');
		asyncExec(cmd, function(result){
			console.log(result.stdout);
			socket.emit('search-hospital', {type: req.type, result: result.stdout});
		});
	});

});



var eventCallback = async function(event) {
	var e = JSON.parse(event.payload);
	if(!e) return;
	console.log("eventCallback: ", [e.TxId, e.EventType, e.Payload]);

	for(var i = 0; i < eventWatcher.length; i++) {
		eventWatcher[i].emit('event', e);
	}

	if(e.EventType === "requestGrant") {
		var payload = JSON.parse(e.Payload);
		if(payload.TargetHospital === hospital) {
			var ccid = payload.RecordId;

			var db = await MongoClient.connect(MongoURL);
			var chaincodeIdToRid =  await db.db(dbname).collection("chaincodeIdToRid").findOne({chaincodeId: ccid});
			var rid = chaincodeIdToRid.rid;
			db.db(dbname).collection("index").insertOne({txid: e.TxId, rid: rid});
		}
	}
};



function updateBlock() {
	var cmd = 'curl -sS sysundc:8888/api/status/mychannel';
	asyncExec(cmd, function(result1){
		// console.log(result1.stdout);
		var lb = JSON.parse(result1.stdout).latestBlock;
		var lbid = parseInt(lb);

		eventWatcher.forEach(function(soc, i){
			if(soc && typeof soc == 'undefined') {
				console.log("fucking eventWatcher ", i);
				return;
			}
			// console.log("lucky eventWatcher ", i);
			var watherLatestBlock = latestBlock[i];
			var startBlock = lbid;
			if(watherLatestBlock && lbid > parseInt(watherLatestBlock.blocknum))
				startBlock = parseInt(watherLatestBlock.blocknum)
			if(watherLatestBlock && startBlock == lbid)
				return;
			var limits = lbid - startBlock + 1;
			cmd = 'curl -sS sysundc:8888/api/blockAndTxList/mychannel/' + startBlock.toString()
					+ '/' + limits.toString() + '/0';
			asyncExec(cmd, function(result2){
				blocks = JSON.parse(result2.stdout);
				latestBlock[i] = blocks.rows[0];
				soc.emit('newBlocks', {blocks: blocks});
			});
		});
	});
	// console.log(updateBlock, latestBlock);
};
setInterval(updateBlock, 1000);


// var getBlockByNumber = function(peer,channelName, blockNumber, username, org) {
// var getTransactionByID = function(peer,channelName, trxnID, username, org) {
// var getBlockByHash = function(peer, hash, username, org) {
// var getChannelHeight=function(peer,channelName,username,org){

app.get('/gbbn/:bn', asyncMiddlewareThreeArgs(async function(req, res, next){
	res.send(await query.getBlockByNumber('peer1', 'mychannel', req.params.bn, 'admin', 'org1'));
}));

// app.get('/gcc', asyncMiddlewareThreeArgs(async function(req, res, next) {
// 	var ret = await query.getChannelConfig('org1', 'mychannel');
// 	console.log(ret);
// 	res.send(ret);
// }));

app.get('/gci', asyncMiddlewareThreeArgs(async function(req, res, next){
	res.send(await query.getChainInfo('peer1', 'mychannel', 'admin', 'org1'));
}));


// ============= start server =======================

var server = http.listen(port, async function() {
	try {
		var db = await MongoClient.connect(MongoURL);
		await db.db(dbname).collection("working_doctor").remove({});
		await db.db(dbname).collection("doctor_patients").remove({});
	}
	catch(e) {
		console.log("failed to clean mongodb: ", e);
	}
	console.log(`Please open Internet explorer to access ：http://${host}:${port}/`);
	myEventListener.myRegisterEventListener('org1', "event", asyncMiddlewareThreeArgs(eventCallback), null);
});
