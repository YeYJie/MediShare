#!/bin/bash

Patient=$1
Doctor=$2
Hospital=$3
PatientTime=$(date +'%s')
PatientSig="patientSig"
PatientPKC="patientPKC"

args='{
	"peers":["127.0.0.1:7051", "127.0.0.1:8051"],
	"fcn":"deRegister",
	"args":["{\"Patient\":\"'$Patient'\",\"Doctor\":\"'$Doctor'\",\"Hospital\":\"'$Hospital'\",\"PatientTime\":\"'$PatientTime'\",\"PatientSig\":\"'$PatientSig'\",\"PatientPKC\":\"'$PatientPKC'\"}"]
}
'

curl -sS \
-H "Accept: application/json" \
-H "Content-Type:application/json" \
--data "$args" \
-X POST "http://127.0.0.1:8080/apis/channels/mychannel/chaincodes/mycc"
