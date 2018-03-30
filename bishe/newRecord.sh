#!/bin/bash

BASEDIR=$(dirname "$0")
SIGNDIR=$BASEDIR/../../pki

Hospital=$1
Doctor=$2
Patient=$3
Inspection=$4
HospitalTime=$(date +'%s')
HospitalSig=$($SIGNDIR/sign "$SIGNDIR/$1.key" "$Hospital!!$Doctor!!$Patient!!$Inspection!!$HospitalTime")
HospitalPKC="hospitalPKC"

args='{
	"peers":["127.0.0.1:7051", "127.0.0.1:8051"],
	"fcn":"newRecord",
	"args":["{\"Hospital\":\"'$Hospital'\",\"Doctor\":\"'$Doctor'\",\"Patient\":\"'$Patient'\",\"Inspection\":\"'$Inspection'\",\"HospitalTime\":\"'$HospitalTime'\",\"HospitalSig\":\"'$HospitalSig'\",\"HospitalPKC\":\"'$HospitalPKC'\"}"]
}
'

curl -sS \
-H "Accept: application/json" \
-H "Content-Type:application/json" \
--data "$args" \
-X POST "http://127.0.0.1:8080/apis/channels/mychannel/chaincodes/mycc"
