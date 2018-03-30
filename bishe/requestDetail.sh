#!/bin/bash

BASEDIR=$(dirname "$0")
SIGNDIR=$BASEDIR/../../pki

Doctor=$1
Hospital=$2
Patient=$3
TargetHospital=$4
RecordId=$5
DoctorProf="doctorProf"
HospitalPKC="hospitalPKC"
RequestTime=$(date +'%s')
DoctorSig=$($SIGNDIR/sign "$SIGNDIR/$1.key" "$Doctor!!$Hospital!!$Patient!!$TargetHospital!!$RecordId!!$RequestTime")
DoctorPKC="doctorPKC"

args='{
	"peers":["127.0.0.1:7051", "127.0.0.1:8051"],
	"fcn":"requestDetail",
	"args":["{\"Doctor\":\"'$Doctor'\",\"Hospital\":\"'$Hospital'\",\"Patient\":\"'$Patient'\",\"TargetHospital\":\"'$TargetHospital'\",\"RecordId\":\"'$RecordId'\",\"DoctorProf\":\"'$DoctorProf'\",\"HospitalPKC\":\"'$HospitalPKC'\",\"RequestTime\":\"'$RequestTime'\",\"DoctorSig\":\"'$DoctorSig'\",\"DoctorPKC\":\"'$DoctorPKC'\"}"]
}
'

curl -sS \
-H "Accept: application/json" \
-H "Content-Type:application/json" \
--data "$args" \
-X POST "http://127.0.0.1:8080/apis/channels/mychannel/chaincodes/mycc"
