#!/bin/bash

#                          $1                  $2     $3        $4      $5 $6         $7
# Usage: ./hospital hospitalPrivateKeyFile patient, hospital, doctor, patientTime, patientSig
# set -x

p=$2
h=$3
d=$4
pt=$5" "$6
s=$7

# echo $0
# echo $1
# echo p
# echo h
# echo d
# echo pt
# echo s


now=$(date +"%F %T")
echo "now: $now"

sig=$(./demo/sign $1 "register" $s "$now")
echo $sig

# patient, hospital, doctor, patientTime, patientSig, hospitalTime, hospitalSig

# http POST :8080/apis/channels/mychannel/chaincodes/mycc peers:='["127.0.0.1:7051", "127.0.0.1:8051"]' fcn="register1" args:='["$2", "$3", "$4", "$5", "$6", "$now", "$sig"]'
# http POST :8080/apis/channels/mychannel/chaincodes/mycc peers:='["127.0.0.1:7051", "127.0.0.1:8051"]'
# p="['127.0.0.1:7051','127.0.0.1:8051']"
# http POST :8080/apis/channels/mychannel/chaincodes/mycc peers:=$p


generate_post_data()
{
  cat <<EOF
{
	"peers": ["127.0.0.1:7051", "127.0.0.1:8051"],
	"fcn": "register1",
	"args": ["$p", "$h", "$d", "$pt", "$s", "$now", "$sig"]
}
EOF
}

# echo $(generate_post_data)

# set -x
curl -isS \
-H "Accept: application/json" \
-H "Content-Type:application/json" \
-X POST --data "$(generate_post_data)" "http://127.0.0.1:8080/apis/channels/mychannel/chaincodes/mycc"
