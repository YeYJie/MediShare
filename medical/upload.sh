#!/bin/bash

uploadType="publish"
fileName="fileForPublish"
fileSize="2K"
fileChecksum="zxicuvha"
uploader="uploader"
uploadTime="1521723683"
uploaderSig="uploaderSig"
uploaderPKC="uploaderPKC"
entry="http://127.0.0.1/fileEntry"
entryFormat="entryFormat"
department="department"
departmentSig="departmentSig"
departmentPKC="departmentPKC"

args='{
	"peers":["127.0.0.1:7051", "127.0.0.1:8051"],
	"fcn":"fileUpload",
	"args":["{\"UploadType\":\"'$uploadType'\",\"FileName\":\"'$fileName'\",\"FileSize\":\"'$fileSize'\",\"FileChecksum\":\"'$fileChecksum'\",\"Uploader\":\"'$uploader'\",\"UploadTime\":\"'$uploadTime'\",\"UploaderSig\":\"'$uploaderSig'\",\"UploaderPKC\":\"'$uploaderPKC'\",\"Entry\":\"'$entry'\",\"EntryFormat\":\"'$entryFormat'\",\"Department\":\"'$department'\",\"DepartmentSig\":\"'$departmentSig'\",\"DepartmentPKC\":\"'$departmentPKC'\"}"]
}
'

# echo $args
# set -x

curl -sS \
-H "Accept: application/json" \
-H "Content-Type:application/json" \
--data "$args" \
-X POST "http://127.0.0.1:8080/apis/channels/mychannel/chaincodes/mycc"

# --data @body.json \

uploadType="upload"
fileName="fileForAuthorization"
entry="http://127.0.0.1:8080/acEntry"

args='{
	"peers":["127.0.0.1:7051", "127.0.0.1:8051"],
	"fcn":"fileUpload",
	"args":["{\"UploadType\":\"'$uploadType'\",\"FileName\":\"'$fileName'\",\"FileSize\":\"'$fileSize'\",\"FileChecksum\":\"'$fileChecksum'\",\"Uploader\":\"'$uploader'\",\"UploadTime\":\"'$uploadTime'\",\"UploaderSig\":\"'$uploaderSig'\",\"UploaderPKC\":\"'$uploaderPKC'\",\"Entry\":\"'$entry'\",\"EntryFormat\":\"'$entryFormat'\",\"Department\":\"'$department'\",\"DepartmentSig\":\"'$departmentSig'\",\"DepartmentPKC\":\"'$departmentPKC'\"}"]
}
'

# echo $args
# set -x

curl -sS \
-H "Accept: application/json" \
-H "Content-Type:application/json" \
--data "$args" \
-X POST "http://127.0.0.1:8080/apis/channels/mychannel/chaincodes/mycc"
