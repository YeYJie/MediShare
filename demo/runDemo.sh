#!/bin/bash

echo "get pri key..."
./getkey.sh
echo "generate doctorProf..."
./sign hospitalPri d1 h1 > doctorProf
echo "generate new newRecord..."
./newRecord.sh ./hospitalPri h1 d1 p1 3 xuechanggui
./newRecord.sh ./hospitalPri h1 d1 p1 2 weijingjiancha
./newRecord.sh ./hospitalPri h1 d1 p1 1 none
echo "patient register..."
./patient.sh ./patientPri p1 h1 d1
