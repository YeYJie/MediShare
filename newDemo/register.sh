#!/bin/bash

generate_args()
{
cat <<EOF
{
	"Patient": "patient",
	"Doctor": "doctor",
	"Hospital": "hospital",		
	"PatientTime": "",		
	"PatientSig": "",		
	"PatientPKC": "",		
	"HospitalTime": "",
	"HospitalSig": "",		
	"HospitalPKC": ""	
}
EOF
}

generate_post_data()
{
cat <<EOF
{
	"peers": ["127.0.0.1:7051", "127.0.0.1:8051"],
	"fcn": "register",
	"args": ["$(generate_args)"]
}
EOF
}

echo "$(generate_args)"
echo "$(generate_post_data)"

# curl -sS \
# -H "Accept: application/json" \
# -H "Content-Type:application/json" \
# --data "$(generate_post_data)" \
# -X POST "http://127.0.0.1:8080/apis/channels/mychannel/chaincodes/mycc"

set -x

http :8080/apis/channels/mychannel/chaincodes/mycc peers==peer1 fcn=="json" args=='["'$(generate_args)'"]'
