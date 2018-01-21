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

var hospitalHandler = function(event) {
	logger.warn(event);
	logger.warn(event.payload.toString("ascii"));
	var splited = event.payload.toString("ascii").split("$$");
	// var doctor = splited[0]
	// var patient = splited[1]
	// var txid = splited[2]
	// logger.warn(doctor);
	// logger.warn(patient);
	// logger.warn(txid);
	// mongo.insertIndex(doctor, txid, patient);
	mongo.insertIndex(splited[0], splited[2], splited[1]);
};

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

exports.hospitalHandler = hospitalHandler;
exports.myregister = myregister;
