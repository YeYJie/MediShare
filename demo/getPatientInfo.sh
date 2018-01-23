#!/bin/bash

patient=$1

generate_post_data()
{
cat <<EOF
{
	"scheme": "sample_scheme",
	"action": "sample_action",
	"params": {
		"kind":1,
		"patient_IDcard":"$patient"
	}
}
EOF
}

curl http://linsiyi:8666/medical/interface.cgi -d "$(generate_post_data)"
