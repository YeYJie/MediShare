#!/bin/bash

doctorId=$1

# set -x

curl -sS "http://127.0.0.1:8080/getPatientInfo/"$doctorId
