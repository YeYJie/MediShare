#!/bin/bash

BASEDIR=$(dirname "$0")
SIGNDIR=$BASEDIR/../../pki

Hid=$1
Hname=$2
Did=$3
Dname=$4
Pid=$5
Pname=$6
Zhenduan=$7
Jianyan=$8
HospitalTime=$(date +'%s')
HospitalSig=$($SIGNDIR/sign "$SIGNDIR/$1.key" "$Hid!!$Hname!!$Did!!$Dname!!$Pid!!$Pname!!$Zhenduan!!$Jianyan!!$HospitalTime")
HospitalPKC="hospitalPKC"

args='{
	"peers":["127.0.0.1:7051", "127.0.0.1:8051"],
	"fcn":"newRecord",
	"args":["{\"Hid\":\"'$Hid'\",\"Hname\":\"'$Hname'\",\"Did\":\"'$Did'\",\"Dname\":\"'$Dname'\",\"Pid\":\"'$Pid'\",\"Pname\":\"'$Pname'\",\"Zhenduan\":\"'$Zhenduan'\",\"Jianyan\":\"'$Jianyan'\",\"HospitalTime\":\"'$HospitalTime'\",\"HospitalSig\":\"'$HospitalSig'\",\"HospitalPKC\":\"'$HospitalPKC'\"}"]
}
'

curl -sS \
-H "Accept: application/json" \
-H "Content-Type:application/json" \
--data "$args" \
-X POST "http://127.0.0.1:8080/apis/channels/mychannel/chaincodes/mycc"
