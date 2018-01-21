#!/bin/bash

#                                  $1             $2      $3      $4      $5        $6
# Usage: ./newRecord.sh hospitalPrivateKeyFile hospital doctor patient recordId inspection

hospitalPrivateKeyFile=$1
hospital=$2
doctor=$3
patient=$4
recordId=$5
inspection=$6

now=$(date +"%F %T")
echo "now: $now"

sig=$(./sign $hospitalPrivateKeyFile $hospital $doctor $patient $recordId "$now" $inspection)
echo $sig

generate_post_data()
{
  cat <<EOF
{
	"peers": ["127.0.0.1:7051", "127.0.0.1:8051"],
	"fcn": "newRecord",
	"args": ["$hospital", "$doctor", "$patient", "$recordId", "$now", "$inspection", "$sig"]
}
EOF
}

# echo $(generate_post_data)

curl -isS \
-H "Accept: application/json" \
-H "Content-Type:application/json" \
-X POST --data "$(generate_post_data)" "http://127.0.0.1:8080/apis/channels/mychannel/chaincodes/mycc"
