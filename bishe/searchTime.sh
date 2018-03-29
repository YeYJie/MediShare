#!/bin/bash

tType=$1
begin=$2
end=$3

args='{
	"peers":["127.0.0.1:7051", "127.0.0.1:8051"],
	"fcn":"searchByTime",
	"args":["'$tType'", "'$begin'", "'$end'"]
}
'

curl -sS \
-H "Accept: application/json" \
-H "Content-Type:application/json" \
--data "$args" \
-X POST "http://127.0.0.1:8080/apis/channels/mychannel/chaincodes/mycc/post"
