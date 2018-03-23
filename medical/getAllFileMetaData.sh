#!/bin/bash

# http :8080/apis/channels/mychannel/chaincodes/mycc peers==peer1 fcn=="getAllFileMetaData" args=='[""]'

curl -sSG \
-H "Accept: application/json" \
-H "Content-Type:application/json" \
--data "peers=peer1" \
--data "fcn=getAllFileMetaData" \
--data-urlencode "args=[\"\"]" \
"http://127.0.0.1:8080/apis/channels/mychannel/chaincodes/mycc"
