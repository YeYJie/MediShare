#!/bin/bash

txid=$1

generate_post_data()
{
cat <<EOF
{
	"scheme": "sample_scheme",
	"action": "sample_action",
	"params": {
		"kind": 5,
		"txid": "$txid"
	}
}
EOF
}
# set -x
curl -sS http://linsiyi:8666/medical/interface.cgi -d "$(generate_post_data)"
