package main

import (
	"fmt"
	// "strconv"
	// "crypto"
	// "crypto/rsa"
	// "crypto/rand"
	// "crypto/x509"
	// "crypto/sha256"
	// "strings"
	// "errors"
	// "encoding/pem"
	// "encoding/hex"
	// "time"
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
	return shim.Success(nil)
}

func (t *SimpleAsset) Invoke(stub shim.ChaincodeStubInterface) peer.Response {

	function, args := stub.GetFunctionAndParameters()
	fmt.Println("invoke is running " + function)

	// if function == "sb" {
	// 	// for debug use, setBalance
	// 	return t.sb(stub, args)
	// } else
	if function == "all" {
		// for debug use, print all states
		return t.printAll(stub)
	} else if function == "te" {
		return t.twoEvent(stub, args)
	} else if function == "setevent" {
		// for debug use, trigger event
		return t.triggerEvent(stub, args)
	} else if function == "echo" {
		// for debug use, echo
		return t.echo(stub, args)
	} else if function == "sleep" {
		return t.sleep(stub, args)
	} else if function == "request" {					// request
		return t.requestWithoutSignature(stub, args)
	} else if function == "requestsig" {
		return t.requestWithSignature(stub, args)
	} else if function == "requestWithPatientGrant" {
		return t.requestWithPatientGrant(stub, args)
	} else if function == "grant" {						// grant
		return t.grantWithoutSignature(stub, args)
	} else if function == "grantsig" {
		return t.grantWithSignature(stub, args)
	} else if function == "newDoctor" {					// doctor
		return t.newDoctor(stub, args)
	} else if function == "getDoctorPrivateKey" {
		return t.getDoctorPrivateKey(stub, args)
	} else if function == "getDoctorPublicKey" {
		return t.getDoctorPublicKey(stub, args)
	} else if function == "newPatient" {				// patient
		return t.newPatient(stub, args)
	} else if function == "getPatientPrivateKey" {
		return t.getPatientPrivateKey(stub, args)
	} else if function == "getPatientPublicKey" {
		return t.getPatientPublicKey(stub, args)
	} else if function == "verify" {					// others
		return t.myverify(stub, args)
	} else if function  == "getDoctorAllRequests" { 	// getter
		return t.getDoctorAllRequests(stub, args)
	} else if function == "getDoctorRequestsToPatient" {
		return t.getDoctorRequestsToPatient(stub, args)
	} else if function == "getPatientRequests" {
		return t.getPatientRequests(stub, args)
	}

	fmt.Println("invoke did not find func: " + function) //error
	return shim.Error("Received unknown function invocation")
}
