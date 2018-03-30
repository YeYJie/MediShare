#!/bin/bash

BASEDIR=$(dirname "$0")
SIGNDIR=$BASEDIR/../../pki

Patient=$1
Doctor=$2
Hospital=$3
PatientTime=$(date +'%s')
PatientSig=$($SIGNDIR/sign "$SIGNDIR/$1.key" "$Patient!!$Doctor!!$Hospital!!$PatientTime")
PatientPKC="patientPKC"
HospitalTime=$(date +'%s')
HospitalSig=$($SIGNDIR/sign "$SIGNDIR/$3.key" "$Patient!!$Doctor!!$Hospital!!$PatientTime!!$HospitalTime")
HospitalPKC="hospitalPKC"

args='{
	"peers":["127.0.0.1:7051", "127.0.0.1:8051"],
	"fcn":"register",
	"args":["{\"Patient\":\"'$Patient'\",\"Doctor\":\"'$Doctor'\",\"Hospital\":\"'$Hospital'\",\"PatientTime\":\"'$PatientTime'\",\"PatientSig\":\"'$PatientSig'\",\"PatientPKC\":\"'$PatientPKC'\",\"HospitalTime\":\"'$HospitalTime'\",\"HospitalSig\":\"'$HospitalSig'\",\"HospitalPKC\":\"'$HospitalPKC'\"}"]
}
'

curl -sS \
-H "Accept: application/json" \
-H "Content-Type:application/json" \
--data "$args" \
-X POST "http://127.0.0.1:8080/apis/channels/mychannel/chaincodes/mycc"
