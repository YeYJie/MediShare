#!/bin/bash


Doctor=$1
Hospital=$2
Patient=$3
DoctorProf="doctorProf"
HospitalPKC="hospitalPKC"
RequestTime=$(date +'%s')
DoctorSig="doctorSig"
DoctorPKC="doctorPKC"
Begin=$4
End=$5


args='{
	"peers":["127.0.0.1:7051", "127.0.0.1:8051"],
	"fcn":"getPatientRecords",
	"args":["{\"Doctor\":\"'$Doctor'\",\"Hospital\":\"'$Hospital'\",\"Patient\":\"'$Patient'\",\"DoctorProf\":\"'$DoctorProf'\",\"HospitalPKC\":\"'$HospitalPKC'\",\"RequestTime\":\"'$RequestTime'\",\"DoctorSig\":\"'$DoctorSig'\",\"DoctorPKC\":\"'$DoctorPKC'\",\"Begin\":\"'$Begin'\",\"End\":\"'$End'\"}"]
}
'

curl -sS \
-H "Accept: application/json" \
-H "Content-Type:application/json" \
--data "$args" \
-X POST "http://127.0.0.1:8080/apis/channels/mychannel/chaincodes/mycc/post"
