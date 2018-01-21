#!/bin/bash

#                      		           $1              $2      $3      $4        $5
# Usage:  ./getPatientRecord.sh doctorPrivateKeyFile doctor hospital patient doctorProfFile

doctorPrivateKeyFile=$1
doctor=$2
hospital=$3
patient=$4
doctorProfFile=$5

now=$(date +"%F %T")
echo "now: $now"

doctorProf=$(cat $doctorProfFile)
echo $doctorProf

sig=$(./sign $doctorPrivateKeyFile $doctorProf $patient "$now")
echo $sig

# http :8080/apis/channels/mychannel/chaincodes/mycc fcn=="getPatientRecord" doctor==$doctor hospital==$hospital patient==$patient doctorProf==$doctorProf doctorTime=="$now" doctorSig==$sig

generate_post_data()
{
cat <<EOF
["$doctor", "$hospital", "$patient", "$doctorProf", "$now", "$sig"]
EOF
}

# curl -isS \
# -H "Accept: application/json" \
# -H "Content-Type:application/json" \
# --data "$(generate_post_data)" "http://127.0.0.1:8080/apis/channels/mychannel/chaincodes/mycc"

# http :8080/apis/channels/mychannel/chaincodes/mycc peers==peer1 fcn=="getPatientRecord" args=="$(echo ["$doctor", "$hospital", "$patient", "$doctorProf", "$now", "$sig"])"
http :8080/apis/channels/mychannel/chaincodes/mycc peers==peer1 fcn=="getPatientRecord" args=="$(generate_post_data)"
