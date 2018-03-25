#!/bin/bash

Hospital=$1
Doctor=$2
Patient=$3
RecordId=$4
Inspection=$5
HospitalTime=$(date +'%s')
HospitalSig="hospitalSig"
HospitalPKC="hospitalPKC"

args='{
	"peers":["127.0.0.1:7051", "127.0.0.1:8051"],
	"fcn":"newRecord",
	"args":["{\"Hospital\":\"'$Hospital'\",\"Doctor\":\"'$Doctor'\",\"Patient\":\"'$Patient'\",\"RecordId\":\"'$RecordId'\",\"Inspection\":\"'$Inspection'\",\"HospitalTime\":\"'$HospitalTime'\",\"HospitalSig\":\"'$HospitalSig'\",\"HospitalPKC\":\"'$HospitalPKC'\"}"]
}
'

curl -sS \
-H "Accept: application/json" \
-H "Content-Type:application/json" \
--data "$args" \
-X POST "http://127.0.0.1:8080/apis/channels/mychannel/chaincodes/mycc"
