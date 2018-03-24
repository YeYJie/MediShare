#!/bin/bash

FileId=$1
RequestLauncher=$2
RequestLauncherDepartment=$3
RequestLauncherDepartmentProf="prof"
DepartmentPKC="DepartmentPKC"
RequestTime=$(date +'%s')
RequestLauncherSig="RequestLauncherSig"
RequestLauncherPKC="RequestLauncherPKC"

# \"FileId\":\"'$FileId'\",\"RequestLauncher\":\"'$RequestLauncher'\",\"RequestLauncherDepartment\":\"'$RequestLauncherDepartment'\",\"RequestLauncherDepartmentProf\":\"'$RequestLauncherDepartmentProf'\",\"DepartmentPKC\":\"'$DepartmentPKC'\",\"RequestTime\":\"'$RequestTime'\",\"RequestLauncherSig\":\"'$RequestLauncherSig'\",\"RequestLauncherPKC\":\"'$RequestLauncherPKC'\"

args='{
	"peers":["127.0.0.1:7051", "127.0.0.1:8051"],
	"fcn":"fileRequestAuthorization",
	"args":["{\"FileId\":\"'$FileId'\",\"RequestLauncher\":\"'$RequestLauncher'\",\"RequestLauncherDepartment\":\"'$RequestLauncherDepartment'\",\"RequestLauncherDepartmentProf\":\"'$RequestLauncherDepartmentProf'\",\"DepartmentPKC\":\"'$DepartmentPKC'\",\"RequestTime\":\"'$RequestTime'\",\"RequestLauncherSig\":\"'$RequestLauncherSig'\",\"RequestLauncherPKC\":\"'$RequestLauncherPKC'\"}"]
}
'

curl -sS \
-H "Accept: application/json" \
-H "Content-Type:application/json" \
--data "$args" \
-X POST "http://127.0.0.1:8080/apis/channels/mychannel/chaincodes/mycc"
