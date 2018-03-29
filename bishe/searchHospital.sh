#!/bin/bash

hospital=$1
hType=$2
begin=$3
end=$4

args='{
	"peers":["127.0.0.1:7051", "127.0.0.1:8051"],
	"fcn":"searchByPatient",
	"args":["'$hospital'", "'$hType'", "'$begin'", "'$end'"]
}
'

curl -sS \
-H "Accept: application/json" \
-H "Content-Type:application/json" \
--data "$args" \
-X POST "http://127.0.0.1:8080/apis/channels/mychannel/chaincodes/mycc/post"
