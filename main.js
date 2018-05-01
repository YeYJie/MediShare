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

// var exec = require('await-exe');
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

var doctorIdToName = new Map;
doctorIdToName["14301036"] = "董文广";
doctorIdToName["14301037"] = "詹文华";
doctorIdToName["14301038"] = "万加生";
doctorIdToName["14301039"] = "胡作军";
doctorIdToName["14301040"] = "王劲松";
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
var patientDoctor = new Map;
var registerdPatients = [];
var jianyanke = [];

var workingDoctors = [];
var patientsNotRegister = [];

var eventWatcher = [];

var currentBlock;
var latestBlock = [];

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

app.get('/doc', function(req, res){
	console.log('/doc');
	res.sendFile(__dirname + '/page/doc.html');
});

app.get('/patient', function(req, res){
	console.log('/patient')
	res.sendFile(__dirname + '/page/patient.html');
});

app.get('/jianyanke', function(req, res){
	res.sendFile(__dirname + '/page/jianyanke.html');
});


app.get('/blockchain', function(req, res){
	console.log('/blockchain')
	res.sendFile(__dirname + '/page/blockchain.html');
});

const asyncMiddlewareThreeArgs = fn =>
	(req, res, next) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};

const asyncMiddlewareOneArgs = fn =>
	(req) => {
		Promise.resolve(fn(req)).catch();
	};

app.get('/getDoctorInfo/:id', asyncMiddlewareThreeArgs(async function(req, res, next) {
	var id = req.params.id;
	console.log('/getDoctorInfo/:id ', id);
	var db = await MongoClient.connect(MongoURL);
	var mongoRes = await db.db(dbname).collection("doctor").findOne({id: id}, {header: 0, prikey: 0, pkc: 0});
	res.send(mongoRes);
}));

app.get('/getPatientInfo/:id', asyncMiddlewareThreeArgs(async function(req, res, next) {
	var id = req.params.id;
	console.log('[getPatientInfo] id: ', id);
	var db = await MongoClient.connect(MongoURL);
	var mongoRes = await db.db("patient").collection("patient").findOne({id: id}, {header: 0, prikey: 0, pkc: 0});
	res.send(mongoRes);
}));


app.get('/getDoctorsPatients/:id', function(req, res){
	var id = req.params.id;
	console.log('/getDoctorsPatients/:id ', id);
	var patients = doctorPatients[id];
	if(!patients || !util.isArray(patients) || typeof patients == 'undefined') {
		res.send({patients:[]});
		return;
	}
	var temp = [];
	for(var i = 0; i < patients.length; i++) {
		temp[i] = {name: patientIdToName[patients[i]], id: patients[i]};
	}
	res.send({patients: temp});
});

function doGetHeader(req, res) {
	id = req.params.id;
	console.log('/header/:id ', id);
	res.sendFile(__dirname + '/header/' + id + '.png');
};

app.get('/header/:id', doGetHeader);

async function doRequestDetail(req, res, next) {
	var txid = req.params.txid;
	console.log('[requestDetail] txid: ', txid);

	var db = await MongoClient.connect(MongoURL);
	var index = await db.db(dbname).collection("index").findOne({txid: txid});
	if(!index) {
		console.log("[doRequestDetail] index not exists, txid: ", txid);
		setTimeout(doRequestDetail(req, res, next), 50);
		return;
	}
	var rid = index.rid;
	console.log("[doRequestDetail] rid: ", rid);
	var detail = await db.db(dbname).collection("data").findOne({rid: rid});
	console.log("[doRequestDetail] detail: ", detail);
	res.send(detail);
	// MongoClient.connect(MongoURL, function(err, db) {
	// 	if (err) throw err;
	// 	var dbo = db.db(dbname);
	// 	dbo.collection("index").findOne({txid: txid}, function(err, res) {
	// 		if (err) throw err;
	// 		if(!res) {
	// 			setTimeout(doRequestDetail(req, httpRes), 50);
	// 			return;
	// 		}
	// 		var rid = res.rid;
	// 		console.log("find mongodb [index] rid: ", rid);
	// 		dbo.collection("data").findOne({rid: rid}, function(err, res) {
	// 			if(err) throw err;
	// 			console.log("find mongodb [data] ", res);
	// 			httpRes.send(res);
	// 			db.close();
	// 		});
	// 	});
	// });
}

app.get('/requestDetail/:txid', asyncMiddlewareThreeArgs(doRequestDetail));

// app.get('/getPatientNameFromId/:pid', function(req, res){
// 	var pid = req.params.pid;
// 	// res.send(patientIdToName[pid]);
// 	MongoClient.connect(MongoURL, function(err, db) {
// 		if (err) throw err;
// 		var dbo = db.db("patient");
// 		dbo.collection("patient").findOne({id: pid}, {name: 1},  function(err, mres) {
// 			if (err) throw err;
// 			res.send(mres.name);
// 			db.close();
// 		});
// 	});
// });

app.get('/getPatientNameFromId/:pid', asyncMiddlewareThreeArgs(async function(req, res, next){
	var pid = req.params.pid;
	var db = await MongoClient.connect(MongoURL);
	var name = await db.db("patient").collection("patient").findOne({id: pid}, {name: 1});
	res.send(name.name);
}));

app.get('/file/:fileName', function(req, res){
	var fileName = req.params.fileName;
	res.sendFile(__dirname + '/file/' + fileName);
});

const fileUpload = require('express-fileupload');
app.use(fileUpload());

app.post('/upload', asyncMiddlewareThreeArgs(async function(req, res){

	var currentTime = Math.floor(new Date() / 1000).toString();
	var did = req.body.did;
	var pid = req.body.pid;
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

	// MongoClient.connect(MongoURL, function(err, db) {
	// 	if (err) throw err;
	// 	var dbo = db.db(dbname);
	// 	dbo.collection("data").insertOne(data, function(err, res) {
	// 		if (err) throw err;
	// 		console.log("insert into mongodb [data] success");
	// 		// db.close();

	// 		var cmd = ['./bishe/newRecord.sh', hospital, did, pid, data.zhenduan].join(' ');
	// 		asyncExec(cmd, function(result){
	// 			// res.send("upload files success");
	// 			var txid = result.stdout;
	// 			var chaincodeIdToRid = {rid: recordId, chaincodeId: txid};
	// 			dbo.collection("chaincodeIdToRid").insertOne(chaincodeIdToRid, function(err, res){
	// 				if(err) throw err;
	// 				console.log("insert into mongodb [chaincodeIdToRid] success");
	// 				db.close();
	// 			});
	// 		});
	// 	});
	// });
	var db = await MongoClient.connect(MongoURL);
	db.db(dbname).collection("data").insertOne(data);
	var cmd = ['./bishe/newRecord.sh', hospital, did, pid, data.zhenduan].join(' ');
	var execResult = await exec(cmd);
	var txid = execResult.stdout;
	var chaincodeIdToRidRecord = {rid: recordId, chaincodeId: txid};
	db.db(dbname).collection("chaincodeIdToRid").insertOne(chaincodeIdToRidRecord);

	res.send("upload file success");
}));

app.get('/execAwaitTest', asyncMiddlewareThreeArgs(async function(req, res){
	var echo = await exec('echo "shit"');
	res.send(echo);
}));


app.post('/jianyankeUpload', function(req, res){

	var currentTime = Math.floor(new Date() / 1000).toString();
	var pid = req.body.pid;
	var did = patientDoctor[pid];

	var data = req.body;
	data.files = null;
	data.did = did;
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

	console.log('jianyankeUpload', [pid, did], data);
	doctorSocket[did].emit("newInspection", {data: data});
	doctorSocket[did].emit("debug", {msg: "shit"});
	res.send("upload file success");
});


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
	// socket.on('signupState', function(req) {
	// 	var role = req.role;
	// 	var id = req.id;
	// 	var name = "yeyongjie";
	// 	console.log('signupState', [role, id]);
	// 	var prikey = "prikey";
	// 	var pkc = "pkc";
	// 	socket.emit('signUpSuccess', {role: role, id: id, name: name, prikey: prikey, pkc: pkc});
	// });


	/*
	*	For Patient
	*/
	socket.on('newPatient', function(req){
		patientsNotRegister.push(socket);
		socket.emit('doctors', {doctors: workingDoctors, hname: hospitalName});
	});
	socket.on('register', asyncMiddlewareOneArgs(async function(req){
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
		});

		cmd = './bishe/getDoctorInfo.sh ' + did;
		console.log(cmd);
		// asyncExec(cmd, function(result){
		// 	console.log('./bishe/getDoctorInfo.sh result: ', result.stdout);
		// 	socket.emit('doctorInfo', {did: did, hospitalName: hospitalName, doctorInfo: result.stdout});
		// });
		var execResult = await exec(cmd);
		var doctorInfo = execResult.stdout;
		socket.emit('doctorInfo', {did: did, hospitalName: hospitalName, doctorInfo: doctorInfo});

		registerdPatients.push(pid);
		patientDoctor[pid] = did;
		jianyanke.forEach(function(socket){
			if(!socket || typeof socket == undefined) return;
			socket.emit('patients', {patients:[{id: pid, name: patientIdToName[pid]}]});
		});
	}));
	socket.on('deRegister', function(req){
		var pid = req.id;
		var did = req.did;
		var time = req.time;
		var sig = req.sig;
		var pkc = req.pkc;
		deRegister(pid, did);
		console.log('patient deRegister', [pid, did, time, sig, pkc]);
		var cmd = ['./bishe/deRegister.sh', pid, did, hospital].join(' ');
		// asyncExec(cmd, function(result){
		// 	console.log("patient deRegister success");
		// });
		exec(cmd);

		var index = registerdPatients.indexOf(pid);
		if(index > -1)
			registerdPatients.splice(index, 1);
		delete patientDoctor[pid];
		delete patientSocket[pid];
		jianyanke.forEach(function(socket){
			if(!socket || typeof socket == undefined) return;
			socket.emit('deRegister', {pid: pid});
		});
	});

	/*
	*	For jianyanke
	*/
	socket.on('jianyanke', function(req){
		jianyanke.push(socket);
		var patients = [];
		registerdPatients.forEach(function(pid) {
			patients.push({id: pid, name: patientIdToName[pid]});
		});
		socket.emit('patients', {patients: patients});
	});


	/*
	*	For Doctor
	*/

	socket.on('login', asyncMiddlewareOneArgs(async function(req){
		var id = req.id;
		var pwd = req.pwd;
		console.log('login', [id, pwd]);
		doctorSocket[id] = socket;
		eventWatcher.push(socket);
		// myEventListener.myRegisterEventListener('org1', "d1", doctor.doctorHandler, socket);
		var cmd = './bishe/getDoctorInfo.sh ' + id;
		console.log(cmd);
		// asyncExec(cmd, function(result){
		// 	console.log('./bishe/getDoctorInfo.sh result: ', result.stdout);
		// 	var doctorInfo = JSON.parse(result.stdout);
		// 	workingDoctors.push({did: id, name: doctorInfo.name, keshi: doctorInfo.keshi});
		// 	console.log('doctor login', workingDoctors);
		// 	socket.emit('doctorInfo', {id: id, hospitalName: hospitalName, doctorInfo: result.stdout});
		// 	for(var i = 0; i < patientsNotRegister.length; i++) {
		// 		patientsNotRegister[i].emit("newWorkingDoctor", {doctor: {did: id, name: doctorInfo.name, keshi: doctorInfo.keshi}});
		// 	}
		// })

		var execResult = await exec(cmd);
		var doctorInfo = JSON.parse(execResult.stdout);

		workingDoctors.push({did: id, name: doctorInfo.name, keshi: doctorInfo.keshi});
		console.log('doctor login', workingDoctors);
		socket.emit('doctorInfo', {id: id, hospitalName: hospitalName, doctorInfo: execResult.stdout});

		for(var i = 0; i < patientsNotRegister.length; i++) {
			patientsNotRegister[i].emit("newWorkingDoctor", {doctor: {did: id, name: doctorInfo.name, keshi: doctorInfo.keshi}});
		}


		cmd = './bishe/getDoctorsPatients.sh ' + id;
		console.log(cmd);
		// asyncExec(cmd, function(result){
		// 	console.log('./bishe/getDoctorsPatients.sh result: ', result.stdout);
		// 	socket.emit('doctorPatients', {id: id, patients: JSON.parse(result.stdout).patients});
		// });
		execResult = await exec(cmd);
		var doctorPatients = JSON.parse(execResult.stdout).patients;
		console.log("[socket.on doc login] doctorPatients: ", doctorPatients);
		socket.emit('doctorPatients', {id: id, patients: doctorPatients});
	}));

	socket.on("doctorLogout", function(req) {
		var did = req.did;
		delete doctorSocket[did];
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

	socket.on('getPatientRecords', asyncMiddlewareOneArgs(async function(req){
		var doctorId = req.doctorId;
		var patientId = req.patientId;
		console.log('getPatientRecords', [doctorId, patientId]);
		var cmd = './bishe/getPatientInfo.sh ' + patientId;
		console.log(cmd);
		// asyncExec(cmd, function(result){
		// 	console.log('./bishe/getPatientInfo.sh result: ', result.stdout);
		// 	socket.emit('patientInfo', {id: patientId, hospital: hospital, patientInfo: result.stdout});
		// })
		var execResult = await exec(cmd);
		var patientInfo = execResult.stdout;
		socket.emit('patientInfo', {id: patientId, hospital: hospital, patientInfo: patientInfo});

		var end = Math.floor(new Date() / 1000);
		cmd = './bishe/getPatientRecords.sh ' + doctorId + ' ' + hospital + ' ' + patientId + ' 0 ' + end.toString();
		// asyncExec(cmd, function(result) {
		// 	console.log('./bishe/getPatientRecords.sh result: ', result.stdout);
		// 	var records = JSON.parse(result.stdout).Records;
		// 	if(records) {
		// 		for(var i = 0; i < records.length; i++)
		// 			records[i].Doctor = doctorIdToName[records[i].Doctor];
		// 	}
		// 	socket.emit('patientRecords', {id: patientId, records: records});
		// });

		execResult = await exec(cmd);
		var patientRecords = JSON.parse(execResult.stdout).Records;
		console.log("[socket.on getPatientRecords] patientRecords: ", patientRecords);
		if(patientRecords) {
			for(var i = 0; i < patientRecords.length; i++)
				patientRecords[i].Doctor = doctorIdToName[patientRecords[i].Doctor];
		}
		socket.emit('patientRecords', {id: patientId, records: patientRecords});
	}));

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

		var targetHospitalIpPort = "http://172.18.232.124:8080";
		if(targetHospital.toString() === "2")
			targetHospitalIpPort = "http://172.18.232.124:8181";

		cmd = 'curl -sS ' + targetHospitalIpPort + '/requestDetail/' + txid;
		execResult = await exec(cmd);
		var recordDetail = execResult.stdout;
		console.log("[socket.on requestDetail] recordDetail: ", recordDetail);
		socket.emit('recordDetail', {did: did, pid:pid, txid: txid,
			rid: rid, targetHospital: targetHospital, recordDetail: recordDetail});


		// asyncExec(cmd, function(result) {
		// 	console.log(cmd, result.stdout);

		// 	if(result.stdout.indexOf(' ') >= 0) {
		// 		console.log('requestDetail failed');
		// 	} else {
		// 		var txid = result.stdout;

		// 		var targetHospitalIpPort = "http://172.18.232.124:8080";
		// 		if(targetHospital.toString() === "2")
		// 			targetHospitalIpPort = "http://172.18.232.124:8181";

		// 		cmd = 'curl -sS ' + targetHospitalIpPort + '/requestDetail/' + txid;
		// 		console.log(cmd);
		// 		asyncExec(cmd, function(result){
		// 			console.log(cmd, result.stdout);
		// 			socket.emit('recordDetail', {did: did, pid:pid, txid: txid,
		// 				rid: rid, targetHospital: targetHospital, recordDetail: result.stdout});
		// 		});
		// 	}

		// });
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

			// MongoClient.connect(MongoURL, function(err, db) {
			// 	if (err) throw err;
			// 	var dbo = db.db(dbname);
			// 	dbo.collection("chaincodeIdToRid").findOne({chaincodeId: ccid}, function(err, res) {
			// 		if (err) throw err;
			// 		var rid = res.rid;
			// 		console.log("find mongodb [chaincodeIdToRid] rid: ", rid);
			// 		dbo.collection("index").insertOne({txid: e.TxId, rid: rid}, function(err, res) {
			// 			if(err) throw err;
			// 			console.log("insert into mongodb [index] success", [e.TxId, rid]);
			// 			db.close();
			// 		});
			// 	});
			// });

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


// ============= start server =======================

var server = http.listen(port, function() {
	console.log(`Please open Internet explorer to access ：http://${host}:${port}/`);
	myEventListener.myRegisterEventListener('org1', "event", asyncMiddlewareThreeArgs(eventCallback), null);
});
