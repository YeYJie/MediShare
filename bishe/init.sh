#!/bin/bash

currentDir=$(dirname "$0")

# set -x

bash $currentDir/newRecord.sh shengzhongyi 123 1 recordId1 xuechanggui
bash $currentDir/newRecord.sh shengzhongyi 123 1 recordId2 shengao
bash $currentDir/newRecord.sh shengzhongyi 123 1 recordId3 tizhong

# bash $currentDir/register.sh 1 123 shengzhongyi
