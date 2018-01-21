package main

import (
	// "fmt"
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
	// "github.com/hyperledger/fabric/core/chaincode/shim"
	// "github.com/hyperledger/fabric/protos/peer"
)

// func (t *SimpleAsset) doRequest(stub shim.ChaincodeStubInterface, doctor, patient string) error {

// 	txid := stub.GetTxID()
// 	// txTimestampRaw, _ := stub.GetTxTimestamp()
// 	// seconds, nanos := txTimestampRaw.GetSeconds(), int64(txTimestampRaw.GetNanos())
// 	// txTimestamp := time.Unix(seconds, nanos).Format("2006-01-02 15:04:05 Mon")
// 	txTimestamp := t.getTxTimestamp(stub)

// 	key, err := stub.CreateCompositeKey("request", []string{doctor, patient, txid})
// 	if err != nil {
// 		return err
// 	}
// 	err = stub.PutState(key, []byte(txTimestamp))
// 	if err != nil {
// 		return err
// 	}
// 	err = stub.PutState(txid, []byte("request$$" + doctor + "$$" + patient + "$$" + txTimestamp))
// 	if err != nil {
// 		return err
// 	}
// 	key, err = stub.CreateCompositeKey("patient", []string{patient, txid})
// 	if err != nil {
// 		return err
// 	}
// 	err = stub.PutState(key, []byte(doctor + "$$" + txTimestamp))
// 	if err != nil {
// 		return err
// 	}

// 	payload := []byte(patient + "$$" + txid + "$$" + doctor + "$$" + txTimestamp)
// 	err = stub.SetEvent("patient", payload)
// 	if err != nil {
// 		return err
// 	}
// 	return nil
// }

// func (t *SimpleAsset) requestWithoutSignature(stub shim.ChaincodeStubInterface, args []string) peer.Response {

// 	// args
// 	//
// 	// doctor 	patient
// 	if len(args) != 2 {
// 		return shim.Error("Incorrect number of arguments")
// 	}
// 	doctor, patient := args[0], args[1]

// 	err := t.doRequest(stub, doctor, patient)
// 	if err != nil {
// 		return shim.Error(err.Error())
// 	}
// 	return shim.Success(nil)
// }

// func (t *SimpleAsset) requestWithSignature(stub shim.ChaincodeStubInterface, args []string) peer.Response {

// 	// args
// 	//
// 	// doctor  patient  n  sig
// 	if len(args) != 4 {
// 		return shim.Error("Incorrect number of arguments")
// 	}
// 	doctor, patient, n, sig := args[0], args[1], args[2], args[3]

// 	err := t.doVerifyDoctorRequest(stub, doctor, patient, n, sig)
// 	if err != nil {
// 		return shim.Error(err.Error())
// 	}

// 	err = t.doRequest(stub, doctor, patient)
// 	if err != nil {
// 		return shim.Error(err.Error())
// 	}
// 	return shim.Success(nil)
// }

// func (t *SimpleAsset) requestWithPatientGrant(stub shim.ChaincodeStubInterface, args []string) peer.Response {

// 	// args
// 	//
// 	// doctor  patient  doctorN  doctorSignature  patientN  patientSignature
// 	if len(args) != 6 {
// 		return shim.Error("Incorrect number of arguments")
// 	}
// 	doctor, patient, doctorN, doctorSig, patientN, patientSig := args[0], args[1], args[2], args[3], args[4], args[5]


// 	err := t.doVerifyDoctorRequest(stub, doctor, patient, doctorN, doctorSig)
// 	if err != nil {
// 		return shim.Error(err.Error())
// 	}

// 	content := doctorSig + "$$" + patientN
// 	err = t.doVerifyPatientSignature(stub, patient, content, patientSig)
// 	if err != nil {
// 		return shim.Error(err.Error())
// 	}

// 	err = t.doRequest(stub, doctor, patient)
// 	if err != nil {
// 		return shim.Error(err.Error())
// 	}

// 	txid := stub.GetTxID()
// 	err = t.doGrant(stub, patient, txid, doctor)
// 	if err != nil {
// 		return shim.Error(err.Error())
// 	}
// 	return shim.Success(nil)
// }
