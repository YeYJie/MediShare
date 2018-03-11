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
var logger = helper.getLogger('myRegisterEventListener');

if(config.enableTls){
    hfc.addConfigFile(path.join(__dirname, 'network-config-tls.json'));
}else{
    hfc.addConfigFile(path.join(__dirname, 'network-config.json'));
}
hfc.setLogger(logger);
var ORGS = hfc.getConfigSetting('network-config');

var eh = null;

var myregisterEventListener = function(org, eventName, callback, socket) {

    logger.warn("========== Register Event Listener " + eventName + " ==========");
    helper.getAdminUser(org).then(
        (user) => {
            var client = helper.getClientForOrg(org);
            client.setUserContext(user);
            // logger.warn(client);
            eh = client.newEventHub();

            var tlspath = path.join(__dirname, "../", ORGS[org]['peer1']['tls_cacerts']);
            // logger.warn(ORGS);
            let data = fs.readFileSync(tlspath)
            eh.setPeerAddr(ORGS[org]['peer1']['events'], {
                            pem: Buffer.from(data).toString(),
                            'ssl-target-name-override': ORGS[org]['peer1']['server-hostname']
                        });
            eh.registerChaincodeEvent("mycc", eventName,
                (e) => {
                    logger.warn("========== " + eventName + " ==========");
                    if(socket)
                        callback(e, socket);
                    else
                        callback(e);
                    logger.warn("========== " + eventName + " ==========");
                },
                (err) => {
                    logger.warn("========== " + eventName + " err ==========");
                    logger.warn(err);
                    logger.warn("========== " + eventName + " err ==========");
                });
             eh.connect();
        },
        (err) => {
            logger.error(err);
        }
    );
}

exports.myRegisterEventListener = myregisterEventListener;
