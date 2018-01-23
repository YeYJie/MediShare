'use strict';
var path = require('path');
var fs = require('fs');
var util = require('util');
var Peer = require('fabric-client/lib/Peer.js');
var EventHub = require('fabric-client/lib/EventHub.js');
var config = require('../config.json');
var helper = require('./helper.js');
var logger = helper.getLogger('hospital');
var mongo = require("./mongo.js");

const exec = util.promisify(require('child_process').exec);

async function shit(cmd) {
  const { stdout, stderr } = await exec(cmd);
  console.log('stdout:', stdout);
  console.log('stderr:', stderr);
};

var myregister = function(patient, hospital, doctor, patientTime, patientSig) {
	console.log('calling hospital.register...');

	var cmd = "./demo/hospital.sh ./demo/hospitalPri";
	cmd += " " + patient;
	cmd += " " + hospital;
	cmd += " " + doctor;
	cmd += " " + patientTime;
	cmd += " " + patientSig;
	console.log(cmd);
	shit(cmd);
};

var hospitalHandler = function(event) {
	// mongo.insertIndex(splited[0], splited[2], splited[1]);
	var payload = event.payload.toString("ascii");
	var tokens = payload.split("$$");
	var doctor = tokens[0];
	var hospital = tokens[1];
	var patient = tokens[2];
	var targetHospital = tokens[3];
	var recordId = tokens[4];
	var txId = tokens[5];
	// console.log(tokens);
	var cmd = "./demo/buildIndex.sh " + recordId + " " + txId;
	console.log(cmd);
	shit(cmd);
};

exports.hospitalHandler = hospitalHandler;
exports.myregister = myregister;
