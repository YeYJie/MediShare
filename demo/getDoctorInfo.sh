#!/bin/bash

doctorId=$1

generate_post_data()
{
cat <<EOF
{
	"scheme": "sample_scheme",
	"action": "sample_action",
	"params": {
		"kind": 2,
		"doctor_IDcard": "$doctorId"
	}
}
EOF
}
# set -x
curl -sS http://linsiyi:8666/medical/interface.cgi -d "$(generate_post_data)"
