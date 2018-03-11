'use strict';
var path = require('path');
var fs = require('fs');
var util = require('util');
var Peer = require('fabric-client/lib/Peer.js');
var EventHub = require('fabric-client/lib/EventHub.js');
var config = require('../config.json');
var helper = require('./helper.js');
var logger = helper.getLogger('doctor');

const exec = util.promisify(require('child_process').exec);

async function shit(cmd) {
  const { stdout, stderr } = await exec(cmd);
  console.log('stdout:', stdout);
  console.log('stderr:', stderr);
};

var getPatientRecord = function(patient) {
	console.log('calling doctor.getPatientRecord...');

	var cmd = "./demo/getPatientRecord.sh ./demo/doctorPri d1 h1 " + patient + " ./demo/doctorProf";

	console.log(cmd);
	shit(cmd);
};

var doctorHandler = function(event, socket) {
	logger.warn(event);
	// logger.warn(event.payload.toString("ascii"));
	var eventName = event.event_name;
	var payload = event.payload.toString("ascii");
	var tokens = payload.split("$$");
	var doctor = tokens[0];
	var hospital = tokens[1];
	var patient = tokens[2];
	var targetHospital = tokens[3];
	var recordId = tokens[4];
	var txId = tokens[5];
	console.log(tokens);
	socket.emit('chat message', payload);

	var cmd = './demo/getData.sh ' + txId;
	exec(cmd)
		.then((result) => {
			socket.emit('recordDetail', {recordDetail: result.stdout});
		})
		.catch((err) => {
			console.error('ERROR: ', err);
		});
};


exports.doctorHandler = doctorHandler;
exports.getPatientRecord = getPatientRecord;
