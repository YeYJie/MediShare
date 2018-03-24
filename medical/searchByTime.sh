#!/bin/bash

QuertLauncher=$1
FileName=""
Department=""
Uploader=""
Begin=$2
End=$3
QuertLauncherSig=""
QueryLauncherPKC=""

if [ "$Begin" = "NaN" ]; then
	Begin=""
fi;
if [ "$End" = "NaN" ]; then
	End=""
fi;

args='{
	"peers":["127.0.0.1:7051", "127.0.0.1:8051"],
	"fcn":"fileSearchByTime",
	"args":["{\"QuertLauncher\":\"'$QuertLauncher'\",\"FileName\":\"'$FileName'\",\"Department\":\"'$Department'\",\"Uploader\":\"'$Uploader'\",\"Begin\":\"'$Begin'\",\"End\":\"'$End'\",\"QuertLauncherSig\":\"'$QuertLauncherSig'\",\"QueryLauncherPKC\":\"'$QueryLauncherPKC'\"}"]
}
'

curl -sS \
-H "Accept: application/json" \
-H "Content-Type:application/json" \
--data "$args" \
-X POST "http://127.0.0.1:8080/apis/channels/mychannel/chaincodes/mycc/post"
