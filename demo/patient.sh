#!/bin/sh

#                            $1             $2        $3         $4
# Uasge: ./patient.sh privateKeyFileName patientId hospitalId doctorId

now=$(date +"%F %T")
echo "now: $now"

sig=$(./sign $1 "register" $2 $3 $4 "$now")
echo $sig

http :8080/apis/register patient==$2 hospital==$3 doctor==$4 patientTime=="$now" patientSig==$sig
