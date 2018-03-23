package main

import (
	"fmt"
	"strings"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)


type SimpleAsset struct {
}

func main() {
	if err := shim.Start(new(SimpleAsset)); err != nil {
		fmt.Printf("Error starting SimpleAsset chaincode: %s", err)
	}
}

func (t *SimpleAsset) Init(stub shim.ChaincodeStubInterface) peer.Response {

	rootCertificate := "rootCertificate"
// 	rootCertificate := `-----BEGIN CERTIFICATE-----
// MIIDLzCCAhegAwIBAgIJAIF4B1QIfJuOMA0GCSqGSIb3DQEBCwUAMBQxEjAQBgNV
// BAMMCXlleW9uZ2ppZTAeFw0xODAzMTMwNDEyMjlaFw0yODAzMTAwNDEyMjlaMBQx
// EjAQBgNVBAMMCXlleW9uZ2ppZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
// ggEBAKfGPo2vOPkuLGwJkXXcdEnaZJx4K8qhzemsZzhtp8nCPeztKOqwa8WtyVyV
// S6Vow9+KRXU1oFLnxpftXaYsjtpXqfpiJbhZWA9HdcP4n9jJJVLVXMkW5TI0+RsE
// zoqFJf1Enh0h53Epe5a7arbM2bNSfpWY8oxdrOE0i9yUrf3CeyqUl0Xl0Do8NF87
// +JJBVf8Unp+RfunRxleX6vsTin2U6ujcu0l4v2G+TBdO0RoOViIgdwcebXgMsWX5
// aziMMZvnwA8/HYDtbGi+2tvywvetqhA6uUg6BwEMDV8y8kx/+E/TUzMBk+syJqNM
// Nxq0u5eL4XPSQ/ezpDfiaINd/scCAwEAAaOBgzCBgDAdBgNVHQ4EFgQUSwBCQsu8
// xFai8SbhbYTK7SK4yacwRAYDVR0jBD0wO4AUSwBCQsu8xFai8SbhbYTK7SK4yaeh
// GKQWMBQxEjAQBgNVBAMMCXlleW9uZ2ppZYIJAIF4B1QIfJuOMAwGA1UdEwQFMAMB
// Af8wCwYDVR0PBAQDAgEGMA0GCSqGSIb3DQEBCwUAA4IBAQBG47Y1XV6cHxsaQMPQ
// WexKWT747/hUJk2PvhgzuuQbu5qrcCLQ4kZG5yoxbrzDXBFFUtRmy1XMoCYf8+JW
// +ckpGXzaNdpg+PZFEiZI84tZ8WomHG14F+rwq1hGvPyQkFTS/+wdQ6wLJpqhh/F5
// lxtrzu+IXLCwYSHDmQmf19VUF+8iyQokx0CLBue98msIPq4lXzLgeBn00H7pvhua
// lEHo4FmQGOizh0aInwq/twoyhE6rxLo4CRxb4UNMQ2tck/ff/ucv03x+ulNqFO8y
// W4ej1PG8UD5gYeDFHjwMBXiB5ZLZGtwMJskTi6F5MXcWah2R6IsW0kQmSy5pwT6q
// 1xdH
// -----END CERTIFICATE-----`

	stub.PutState("rootCertificate", []byte(rootCertificate))
	return shim.Success(nil)
}

func (t *SimpleAsset) appendkv(stub shim.ChaincodeStubInterface, iter shim.StateQueryIteratorInterface, dst string) string {
	for iter.HasNext() {
		kv, _ := iter.Next()
		object, attrib, _ := stub.SplitCompositeKey(kv.Key)
		dst += object + " " + strings.Join(attrib, " ") + "  ->  " + string(kv.Value) + "\n"
	}
	return dst;
}

func (t *SimpleAsset) all(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	res := ""

	iter, _ := stub.GetStateByRange("", "")
	for iter.HasNext() {
		kv, _ := iter.Next()
		res += kv.Key + "  ->  " + string(kv.Value) + "\n"
	}

	iter, _ = stub.GetStateByPartialCompositeKey("fileNameToFileId", []string{})
	res = t.appendkv(stub, iter, res)

	iter, _ = stub.GetStateByPartialCompositeKey("departmentTimeIndex", []string{})
	res = t.appendkv(stub, iter, res)

	iter, _ = stub.GetStateByPartialCompositeKey("uploaderTimeIndex", []string{})
	res = t.appendkv(stub, iter, res)

	iter, _ = stub.GetStateByPartialCompositeKey("timeIndex", []string{})
	res = t.appendkv(stub, iter, res)

	return shim.Success([]byte(res))
}

func (t *SimpleAsset) Invoke(stub shim.ChaincodeStubInterface) peer.Response {

	function, args := stub.GetFunctionAndParameters()
	// fmt.Println("invoke is running " + function)

	if function == "fileUpload" {
		return t.fileUpload(stub, args)
	} else if function == "fileSearchByName" {
		return t.fileSearchByName(stub, args)
	} else if function == "fileSearchByDepartment" {
		return t.fileSearchByDepartment(stub, args)
	} else if function == "fileSearchByPublisher" {
		return t.fileSearchByPublisher(stub, args)
	} else if function == "fileSearchByTime" {
		return t.fileSearchByTime(stub, args)
	} else if function == "fileSearchByDepartmentAndTime" {
		return t.fileSearchByDepartmentAndTime(stub, args)
	} else if function == "fileSearchByPublisherAndTime" {
		return t.fileSearchByPublisherAndTime(stub, args)
	} else if function == "fileRequestAuthorization" {
		return t.fileRequestAuthorization(stub, args)
	} else if function == "fileRequest" {
		return t.fileRequest(stub, args)
	} else if function == "all" {
		return t.all(stub, args)
	} else if function == "getAllFileMetaData" {
		return t.getAllFileMetaData(stub, args)
	}

	// for unit testing
	if function == "newFileId" {
		t.newFileId(stub, args[0])
		return shim.Success(nil)
	}

	fmt.Println("invoke did not find func: " + function) //error
	return shim.Error("Received unknown function invocation")
}
