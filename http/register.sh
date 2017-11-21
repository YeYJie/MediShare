#!/bin/bash

http :8080/apis/myregister event=="patient"
http :8080/apis/myregister event=="doctor"
http :8080/apis/myregister event=="hospital"

