#!/bin/bash

ye=$1
yong=$2

http :8080/apis/channels/mychannel/chaincodes/mycc peers==peer1 fcn=="json" args=='["{\"Ye\":\"'$ye'\",\"Yong\":\"'$yong'\"}"]'
