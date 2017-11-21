#!/bin/bash

http POST :8080/apis/channels/mychannel/chaincodes/mycc \
	peers:='["127.0.0.1:7051", "127.0.0.1:8051"]' \
	fcn="grant2" \
	args:='["patient1", "$1", "doctor1"]'
