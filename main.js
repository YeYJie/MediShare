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
var hospital = config.hospital;

// var mongodb = require('./app/mongo.js');
var MongoClient = require('mongodb').MongoClient;
var MongoURL = "mongodb://localhost:27017/";

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


var doctorSocket = new Map;
var patientSocket = new Map;
var doctorPatients = new Map;

var doctorNameToId = new Map;
doctorNameToId["zhangsan"] = "123";
doctorNameToId["lisi"] = "456";
var doctorIdToName = new Map;
doctorIdToName["123"] = "zhangsan";
doctorIdToName["456"] = "lisi";

var patientIdToName = new Map;
patientIdToName["1"] = "patient1";
patientIdToName["2"] = "patient2";
patientIdToName["3"] = "patient3";

var eventWatcher = [];

var register = function(pid, keshi, dname) {
	if(dname === "anyone") {
		dname = "zhangsan";
	}
	var doctorId = doctorNameToId[dname];
	if(util.isArray(doctorPatients[doctorId])) {
		doctorPatients[doctorId].push(pid);
	} else {
		doctorPatients[doctorId] = [pid];
	}
	console.log(register, [pid, keshi, dname], doctorPatients[doctorId]);
	return doctorId;
};
var deRegister = function(pid, did) {
	var patients = doctorPatients[did];
	if(!patients)
		return;
	var index = patients.indexOf(pid);
	if (index > -1) {
		doctorPatients[did].splice(index, 1);
	}
	console.log(deRegister, [pid, did], doctorPatients[did]);
};



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

app.get('/blockchain', function(req, res){
	console.log('/blockchain')
	res.sendFile(__dirname + '/page/blockchain.html');
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
	var id = req.params.id;
	console.log('/getDoctorsPatients/:id ', id);
	// res.send({patients: [{name: "patient1", id:1},
	// 		{name: "patient2", id:2}, {name: "patient3", id:3}]});
	var patients = doctorPatients[id];
	if(!util.isArray(patients))
		res.send({patients:[]});
	var temp = [];
	for(var i = 0; i < patients.length; i++) {
		temp[i] = {name: patientIdToName[patients[i]], id: patients[i]};
	}
	res.send({patients: temp});
});

app.get('/header/:id', function(req, res){
	id = req.params.id;
	console.log('/header/:id ', id);
	res.send("header");
});

app.get('/requestDetail/:txid', function(req, httpRes){
	txid = req.params.txid;
	console.log('/requestDetail/:txid ', txid);
	// res.send({a: "123456", b: "456789"});
	MongoClient.connect(MongoURL, function(err, db) {
		if (err) throw err;
		var dbo = db.db("mydb");
		dbo.collection("index").findOne({txid: txid}, function(err, res) {
			if (err) throw err;
			var rid = res.rid;
			console.log("find mongodb [index] rid: ", rid);
			// dbo.collection("index").insertOne({txid: e.TxId, rid: rid}, function(err, res) {
			// 	if(err) throw err;
			// 	console.log("insert into mongodb [index] success", [e.TxId, rid]);
			// 	db.close();
			// });
			dbo.collection("data").findOne({rid: rid}, function(err, res) {
				if(err) throw err;
				console.log("find mongodb [data] ", res);
				httpRes.send(res);
				db.close();
			});
		});
	});
});

app.get('/getPatientNameFromId/:pid', function(req, res){
	var pid = req.params.pid;
	res.send(patientIdToName[pid]);
});

app.get('/file/:fileName', function(req, res){
	var fileName = req.params.fileName;
	res.sendFile(__dirname + '/file/' + fileName);
});

const fileUpload = require('express-fileupload');
app.use(fileUpload());



app.post('/upload', function(req, res){

	var currentTime = Math.floor(new Date() / 1000).toString();
	var did = req.body.did;
	var pid = req.body.pid;
	var recordId = [currentTime, did, pid].join("-");
	var data = {did: did,
				pid: pid,
				rid: recordId,
				inspection: req.body.inspection,
				result: req.body.result,
				analysis: req.body.analysis,
				prescription: req.body.prescription,
				files: []
			};

	if(req.files) {
		// console.log(req.files);
		if(util.isArray(req.files.file)) {
			// console.log("more than one file");
			var files = req.files.file;
			for(var i = 0; i < files.length; i++) {
				var filename = [recordId, i.toString(), files[i].name].join('$$');
				data.files[i] = filename;
				files[i].mv('./file/'+filename,  function(err){
					if(err)
						return res.status(500).send(err);
				});
			}
		}
		else {
			// console.log("single file");
			var file = req.files.file;
			var filename = [recordId, "0", file.name].join('_');
			data.files[0] = filename;
			file.mv('./file/'+filename,  function(err){
				if(err)
					return res.status(500).send(err);
			});
		}
	}

	MongoClient.connect(MongoURL, function(err, db) {
		if (err) throw err;
		var dbo = db.db("mydb");
		dbo.collection("data").insertOne(data, function(err, res) {
			if (err) throw err;
			console.log("insert into mongodb [data] success");
			// db.close();
			var cmd = ['./bishe/newRecord.sh', hospital, did, pid, data.inspection].join(' ');
			asyncExec(cmd, function(result){
				// res.send("upload files success");
				var txid = result.stdout;
				var chaincodeIdToRid = {rid: recordId, chaincodeId: txid};
				dbo.collection("chaincodeIdToRid").insertOne(chaincodeIdToRid, function(err, res){
					if(err) throw err;
					console.log("insert into mongodb [chaincodeIdToRid] success");
					db.close();
				});
			});
		});
	});
	res.send("upload file success");
});


var io = require('socket.io')(http);
io.on('connection', function(socket){

	/*
	*	For event watcher
	*/
	socket.on('watch', function(req) {
		eventWatcher.push(socket);
	});

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
		var pid = req.id;
		var keshi = req.keshi;
		var doctor = req.doctor;
		var time = req.time;
		var sig = req.sig;
		var pkc = req.pkc;
		patientSocket[pid] = socket;
		var did = register(pid, keshi, doctor);
		console.log('patient register', [pid, keshi, doctor, time, sig, pkc]);
		var cmd = ['./bishe/register.sh', pid, did, hospital].join(' ');
		asyncExec(cmd, function(result){
			socket.emit('onRegister', {did:did , msg: "Please go to room 431"});
		});
	});
	socket.on('deRegister', function(req){
		var pid = req.id;
		var did = req.did;
		var time = req.time;
		var sig = req.sig;
		var pkc = req.pkc;
		deRegister(pid, did);
		console.log('patient deRegister', [pid, time, sig, pkc]);
		var cmd = ['./bishe/deRegister.sh', pid, did, hospital].join(' ');
		asyncExec(cmd, function(result){
			console.log("patient deRegister success");
		});
	});


	/*
	*	For Doctor
	*/

	socket.on('login', function(req){
		var id = req.id;
		var pwd = req.pwd;
		console.log('login', [id, pwd]);
		doctorSocket[id] = socket;
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
			var records = JSON.parse(result.stdout).Records;
			if(records) {
				for(var i = 0; i < records.length; i++)
					records[i].Doctor = doctorIdToName[records[i].Doctor];
			}
			socket.emit('patientRecords', {id: patientId, records: records});
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

			if(result.stdout.indexOf(' ') >= 0) {
				console.log('requestDetail failed');
			} else {
				var txid = result.stdout;

				var targetHospitalIpPort = "http://172.18.232.124:8080"

				cmd = 'curl -sS ' + targetHospitalIpPort + '/requestDetail/' + txid;
				console.log(cmd);
				asyncExec(cmd, function(result){
					console.log(cmd, result.stdout);
					socket.emit('recordDetail', {did: did, pid:pid, txid: txid, targetHospital: targetHospital, recordDetail: result.stdout});
				});
			}

		});
	});

});



var eventCallback = function(event) {
	var e = JSON.parse(event.payload);
	if(!e) return;
	console.log("eventCallback: ", [e.TxId, e.EventType, e.Payload]);
	var socket = doctorSocket["123"];
	if(socket)
		socket.emit("event", e);

	for(var i = 0; i < eventWatcher.length; i++) {
		eventWatcher[i].emit('event', e);
	}

	if(e.EventType === "requestGrant") {
		var payload = JSON.parse(e.Payload);
		if(payload.TargetHospital === hospital) {
			var ccid = payload.RecordId;

			MongoClient.connect(MongoURL, function(err, db) {
				if (err) throw err;
				var dbo = db.db("mydb");
				dbo.collection("chaincodeIdToRid").findOne({chaincodeId: ccid}, function(err, res) {
					if (err) throw err;
					var rid = res.rid;
					console.log("find mongodb [chaincodeIdToRid] rid: ", rid);
					dbo.collection("index").insertOne({txid: e.TxId, rid: rid}, function(err, res) {
						if(err) throw err;
						console.log("insert into mongodb [index] success", [e.TxId, rid]);
						db.close();
					});
				});
			});

		}
	}
};

// ============= start server =======================

var server = http.listen(port, function() {
	console.log(`Please open Internet explorer to access ：http://${host}:${port}/`);
	myEventListener.myRegisterEventListener('org1', "event", eventCallback, null);
});





