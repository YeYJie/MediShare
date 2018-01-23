#!/bin/bash

recordId=$1
txid=$2

generate_post_data()
{
cat <<EOF
{
	"scheme": "sample_scheme",
	"action": "sample_action",
	"params": {
		"kind": 4,
		"txid": "$txid",
		"record_ID": $recordId
	}
}
EOF
}

curl -sS http://linsiyi:8666/medical/interface.cgi -d "$(generate_post_data)"
