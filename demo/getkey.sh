#!/bin/bash
http -b :8080/apis/channels/mychannel/chaincodes/mycc peers==peer1 fcn=="hk" args=='[""]' > hospitalPri
http -b :8080/apis/channels/mychannel/chaincodes/mycc peers==peer1 fcn=="dk" args=='[""]' > doctorPri
http -b :8080/apis/channels/mychannel/chaincodes/mycc peers==peer1 fcn=="pk" args=='[""]' > patientPri
