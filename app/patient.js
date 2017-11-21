'use strict';
var path = require('path');
var fs = require('fs');
var util = require('util');
var Peer = require('fabric-client/lib/Peer.js');
var EventHub = require('fabric-client/lib/EventHub.js');
var config = require('../config.json');
var helper = require('./helper.js');
var logger = helper.getLogger('instantiate-chaincode');

var patientHandler = function(event) {
	logger.warn(event);
	logger.warn(event.payload.toString("ascii"));
};

exports.patientHandler = patientHandler;
