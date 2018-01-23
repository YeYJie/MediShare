#!/bin/sh

#                               $1             $2     $3       $4
# Uasge: ./deRegister.sh privateKeyFileName patient hospital doctor

patient=$2
hospital=$3
doctor=$4

now=$(date +"%F %T")
echo "now: $now"

sig=$(./sign $1 "deRegister" $patient $hospital $doctor "$now")
echo $sig

generate_post_data()
{
  cat <<EOF
{
	"peers": ["127.0.0.1:7051", "127.0.0.1:8051"],
	"fcn": "deRegister",
	"args": ["$patient", "$hospital", "$doctor", "$now", "$sig"]
}
EOF
}

# echo $(generate_post_data)

curl -isS \
-H "Accept: application/json" \
-H "Content-Type:application/json" \
-X POST --data "$(generate_post_data)" "http://127.0.0.1:8080/apis/channels/mychannel/chaincodes/mycc"
