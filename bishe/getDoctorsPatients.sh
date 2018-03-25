#!/bin/bash

doctorId=$1

curl -sS "http://127.0.0.1:8080/getDoctorsPatients/"$doctorId
