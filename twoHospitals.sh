#!/bin/bash

set -x

kill -9 $(lsof -t -i:8080)
HOST="localhost" PORT="8080" HOSPITAL="1" HNAME="广东省中医院" DBNAME="hospital1" node main.js >hospital1.log 2>&1 &

kill -9 $(lsof -t -i:8181)
HOST="localhost" PORT="8181" HOSPITAL="2" HNAME="中山大学附属第三医院" DBNAME="hospital2" node main.js >hospital2.log 2>&1 &
