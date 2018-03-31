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

// app.use(express.static(path.join(__dirname,'explorer_client')));
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

var doctorIdToName = new Map;
doctorIdToName["14301036"] = "张三";
doctorIdToName["14301037"] = "李四";
doctorIdToName["14301038"] = "王五";
doctorIdToName["14301039"] = "李六";
doctorIdToName["14301040"] = "叶七";
var patientIdToName = new Map;
patientIdToName["24301030"] = "王勇";
patientIdToName["24301031"] = "张静";
patientIdToName["24301032"] = "李杰";
patientIdToName["24301033"] = "李桂英";
patientIdToName["24301034"] = "张艳";
patientIdToName["24301035"] = "张秀英";
patientIdToName["24301036"] = "张伟";


var doctorSocket = new Map;
var patientSocket = new Map;
var doctorPatients = new Map;

var workingDoctors = [];
var patientsNotRegister = [];

var eventWatcher = [];

var register = function(pid, did) {
	if(did === "0") {
		did = "14301036";
	}
	if(util.isArray(doctorPatients[did])) {
		doctorPatients[did].push(pid);
	} else {
		doctorPatients[did] = [pid];
	}
	console.log(register, [pid, did], doctorPatients[did]);
	return did;
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

// app.get('/doc', function(req, res){
// 	console.log('/doc');
// 	res.sendFile(__dirname + '/page/doctor.html');
// });
// app.get('/gov', function(req, res){
// 	console.log('/doc');
// 	res.sendFile(__dirname + '/page/gov.html');
// });

app.get('/doc', function(req, res){
	console.log('/doc');
	res.sendFile(__dirname + '/page/doc.html');
});

app.get('/patient', function(req, res){
	console.log('/patient')
	res.sendFile(__dirname + '/page/patient.html');
});

// app.get('/newPatient', function(req, res){
// 	console.log('/newPatient')
// 	res.sendFile(__dirname + '/page/newPatient.html');
// });

app.get('/blockchain', function(req, res){
	console.log('/blockchain')
	res.sendFile(__dirname + '/page/blockchain.html');
});

app.get('/getDoctorInfo/:id', function(req, res){
	id = req.params.id;
	console.log('/getDoctorInfo/:id ', id);
	// res.send({ header: "http://172.18.232.124:8080/header/" + id.toString(),
	// 		name: "张医生",
	// 		phone:"15521132718",
	// 		email:"394566396@qq.com",
	// 		addr:"sysundc"});
	MongoClient.connect(MongoURL, function(err, db) {
		if (err) throw err;
		var dbo = db.db(dbname);
		dbo.collection("doctor").findOne({id: id}, {header: 0, prikey: 0, pkc: 0},  function(err, mres) {
			if (err) throw err;
			res.send(mres);
			db.close();
		});
	});
});

app.get('/getPatientInfo/:id', function(req, res){
	id = req.params.id;
	console.log('/getPatientInfo/:id ', id);
	// res.send({ header: "http://172.18.232.124:8080/header/" + id.toString(),
	// 		name: "叶永杰",
	// 		phone:"15521132718",
	// 		email:"sysuyyj@qq.com",
	// 		addr:"sysundc"});
	MongoClient.connect(MongoURL, function(err, db) {
		if (err) throw err;
		var dbo = db.db("patient");
		dbo.collection("patient").findOne({id: id}, {header: 0, prikey: 0, pkc: 0},  function(err, mres) {
			if (err) throw err;
			res.send(mres);
			db.close();
		});
	});
});

app.get('/getDoctorsPatients/:id', function(req, res){
	var id = req.params.id;
	console.log('/getDoctorsPatients/:id ', id);
	// res.send({patients: [{name: "patient1", id:1},
	// 		{name: "patient2", id:2}, {name: "patient3", id:3}]});
	var patients = doctorPatients[id];
	if(!patients || !util.isArray(patients))
		res.send({patients:[]});
	var temp = [];
	for(var i = 0; i < patients.length; i++) {
		temp[i] = {name: patientIdToName[patients[i]], id: patients[i]};
		// temp[i] = {name: "", id: patients[i]};
	}
	res.send({patients: temp});
});

app.get('/header/:id', function(req, res){
	id = req.params.id;
	console.log('/header/:id ', id);
	// res.send("header");
	res.sendFile(__dirname + '/header/' + id + '.png');
});

app.get('/requestDetail/:txid', function(req, httpRes){
	txid = req.params.txid;
	console.log('/requestDetail/:txid ', txid);
	// res.send({a: "123456", b: "456789"});
	MongoClient.connect(MongoURL, function(err, db) {
		if (err) throw err;
		var dbo = db.db(dbname);
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
	// res.send(patientIdToName[pid]);
	MongoClient.connect(MongoURL, function(err, db) {
		if (err) throw err;
		var dbo = db.db("patient");
		dbo.collection("patient").findOne({id: pid}, {name: 1},  function(err, mres) {
			if (err) throw err;
			res.send(mres.name);
			db.close();
		});
	});
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
				data.files[i] = "http://172.18.232.124:" + port + "/file/" + filename;
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
			data.files[0] = "http://172.18.232.124:" + port + "/file/" + filename;
			file.mv('./file/'+filename,  function(err){
				if(err)
					return res.status(500).send(err);
			});
		}
	}

	MongoClient.connect(MongoURL, function(err, db) {
		if (err) throw err;
		var dbo = db.db(dbname);
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

		if(role === "patient") {
			MongoClient.connect(MongoURL, function(err, db) {
				if (err) throw err;
				var dbo = db.db("patient");
				dbo.collection("patient").insertOne({id: id, name: name, pwd: pwd, phone: phone, email: email, addr: addr},
					function(err, res) {
					if (err) throw err;
					console.log("insert into mongodb [patient] success");
					db.close();
					var cmd = '../pki/generateKeyAndCsr.sh ' + id;
					asyncExec(cmd, function(result){
						console.log("signUpSuccess ", result);
						socket.emit('signUpSuccess', {role: role, id: id, name: name});
					});
				});
			});
		}

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
	socket.on('newPatient', function(req){
		patientsNotRegister.push(socket);
		socket.emit('doctors', {doctors: workingDoctors});
	});
	socket.on('register', function(req){
		var pid = req.pid;
		var did = req.did;
		var time = req.time;
		var sig = req.sig;
		var pkc = req.pkc;
		patientSocket[pid] = socket;
		did = register(pid, did);
		console.log('patient register', [pid, did, time, sig, pkc]);
		var cmd = ['./bishe/register.sh', pid, did, hospital].join(' ');
		asyncExec(cmd, function(result){
			var index = patientsNotRegister.indexOf(socket);
			if (index > -1) {
				patientsNotRegister.splice(index, 1);
			}
			// socket.emit('onRegister', {did:did , msg: "Please go to room 431"});
		});

		cmd = './bishe/getDoctorInfo.sh ' + did;
		console.log(cmd);
		asyncExec(cmd, function(result){
			console.log('./bishe/getDoctorInfo.sh result: ', result.stdout);
			socket.emit('doctorInfo', {did: did, hospitalName: hospitalName, doctorInfo: result.stdout});
		})
	});
	socket.on('deRegister', function(req){
		var pid = req.id;
		var did = req.did;
		var time = req.time;
		var sig = req.sig;
		var pkc = req.pkc;
		deRegister(pid, did);
		console.log('patient deRegister', [pid, did, time, sig, pkc]);
		var cmd = ['./bishe/deRegister.sh', pid, did, hospital].join(' ');
		asyncExec(cmd, function(result){
			console.log("patient deRegister success");
		});
	});

	socket.on('keshiAndDoctor', function(req){
		socket.emit('keshiAndDoctor', {"内科": ["张三", "李四"], "外科": ["王五", "李六", "叶七"], "康复科": ["林八"]});
	});


	/*
	*	For Doctor
	*/

	socket.on('login', function(req){
		var id = req.id;
		var pwd = req.pwd;
		console.log('login', [id, pwd]);
		// doctorSocket[id] = socket;
		eventWatcher.push(socket);
		// myEventListener.myRegisterEventListener('org1', "d1", doctor.doctorHandler, socket);
		var cmd = './bishe/getDoctorInfo.sh ' + id;
		console.log(cmd);
		asyncExec(cmd, function(result){
			console.log('./bishe/getDoctorInfo.sh result: ', result.stdout);
			var doctorInfo = JSON.parse(result.stdout);
			workingDoctors.push({did: id, name: doctorInfo.name, keshi: doctorInfo.keshi});
			console.log('doctor login', workingDoctors);
			socket.emit('doctorInfo', {id: id, hospitalName: hospitalName, doctorInfo: result.stdout});
			// socket.emit("newWorkingDoctor", {doctor: {did: id, name: doctorInfo.name, keshi: doctorInfo.keshi}})
			for(var i = 0; i < patientsNotRegister.length; i++) {
				patientsNotRegister[i].emit("newWorkingDoctor", {doctor: {did: id, name: doctorInfo.name, keshi: doctorInfo.keshi}});
			}
		})
		cmd = './bishe/getDoctorsPatients.sh ' + id;
		console.log(cmd);
		asyncExec(cmd, function(result){
			console.log('./bishe/getDoctorsPatients.sh result: ', result.stdout);
			socket.emit('doctorPatients', {id: id, patients: JSON.parse(result.stdout).patients});
		});
	});

	socket.on("doctorLogout", function(req) {
		var did = req.did;
		for(var i = 0; i < workingDoctors.length; i++) {
			if(workingDoctors[i].did === did) {
				workingDoctors.splice(i, 1);
				break;
			}
		}
		for(var i = 0; i < patientsNotRegister.length; i++) {
			patientsNotRegister[i].emit("doctorLogout", {did: did});
		}
		console.log("doctorLogout", did, workingDoctors);
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



var eventCallback = function(event) {
	var e = JSON.parse(event.payload);
	if(!e) return;
	console.log("eventCallback: ", [e.TxId, e.EventType, e.Payload]);
	// var socket = doctorSocket["123"];
	// if(socket)
	// 	socket.emit("event", e);

	for(var i = 0; i < eventWatcher.length; i++) {
		eventWatcher[i].emit('event', e);
	}

	if(e.EventType === "requestGrant") {
		var payload = JSON.parse(e.Payload);
		if(payload.TargetHospital === hospital) {
			var ccid = payload.RecordId;

			MongoClient.connect(MongoURL, function(err, db) {
				if (err) throw err;
				var dbo = db.db(dbname);
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
