#!/bin/bash

#                            $1               $2    $3        $4        $5           $6         $7
# Usage: ./request.sh doctorPrivateKeyFile doctor hospital patient targetHospital recordId doctorProfFile

doctorPrivateKeyFile=$1
doctor=$2
hospital=$3
patient=$4
targetHospital=$5
recordId=$6
doctorProfFile=$7

now=$(date +"%F %T")
# echo "now: $now"

doctorProf=$(cat $doctorProfFile)
# echo $doctorProf

# sig=$(./sign $doctorPrivateKeyFile "request" $doctorProf $patient $targetHospital $recordId "$now")
sig=$(./demo/sign $doctorPrivateKeyFile "request" $doctorProf $patient $targetHospital $recordId "$now")
# echo $sig

# doctor, hospital, patient, targetHospital, recordId, doctorProf, doctorTime, doctorSig
generate_post_data()
{
  cat <<EOF
{
	"peers": ["127.0.0.1:7051", "127.0.0.1:8051"],
	"fcn": "request",
	"args": ["$doctor", "$hospital", "$patient", "$targetHospital", "$recordId", "$doctorProf", "$now", "$sig"]
}
EOF
}

# echo $(generate_post_data)

curl -sS \
-H "Accept: application/json" \
-H "Content-Type:application/json" \
-X POST --data "$(generate_post_data)" "http://127.0.0.1:8080/apis/channels/mychannel/chaincodes/mycc"
