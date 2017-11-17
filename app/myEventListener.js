/*
 Copyright ONECHAIN 2017 All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
'use strict';
var path = require('path');
var fs = require('fs');
var util = require('util');
var hfc = require('fabric-client');
var Peer = require('fabric-client/lib/Peer.js');
var EventHub = require('fabric-client/lib/EventHub.js');
var config = require('../config.json');
var helper = require('./helper.js');
var logger = helper.getLogger('instantiate-chaincode');
hfc.addConfigFile(path.join(__dirname, 'network-config.json'));
var ORGS = hfc.getConfigSetting('network-config');
var tx_id = null;
var eh = null;


var myregisterEventListener = function(org) {

    logger.warn('\n========== Register Event Listener ==========\n');
    var client = helper.getClientForOrg(org);


    eh = client.newEventHub();
    // let data = fs.readFileSync(path.join(__dirname, ORGS[org]['peer1'][
    //                 'tls_cacerts'
    //                 ]));
    eh.setPeerAddr(ORGS[org]['peer1']['events'], {
                    // pem: Buffer.from(data).toString(),
                    'ssl-target-name-override': ORGS[org]['peer1']['server-hostname']
                });

    // eh.registerBlockEvent(
    //   (block) => {
    //     // var first_tx = block.data.data[0]; // get the first transaction
    //     // var header = first_tx.payload.header; // the "header" object contains metadata of the transaction
    //     // var channel_id = header.channel_header.channel_id;
    //     // if ("mychannel" !== channel_id) return;

    //     // do useful processing of the block
    //     logger.warn("\n========== registerBlockEvent ==========\n")
    //     console.log(block)
    //     logger.warn("\n========== registerBlockEvent ==========\n")
    //   },
    //   (err) => {
    //     logger.warn("\n========== registerBlockEvent err ==========\n")
    //     console.log('Oh snap!');
    //     logger.warn("\n========== registerBlockEvent err ==========\n")
    //   }
    // );


    eh.registerChaincodeEvent("mycc", "someEvents",
        (e) => {
            logger.warn("\n========== registerChaincodeEvent ==========\n")
            console.log(e)
            logger.warn("\n========== registerChaincodeEvent ==========\n")
        },
        (err) => {
            logger.warn("\n========== registerChaincodeEvent err ==========\n")
        });

    eh.connect();

};

// exports.instantiateChaincode = instantiateChaincode;
exports.myRegisterEventListener = myregisterEventListener;
