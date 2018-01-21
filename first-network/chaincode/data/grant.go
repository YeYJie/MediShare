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
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

func (t *SimpleAsset) doGrant(stub shim.ChaincodeStubInterface, patient, txid, doctor string) error {

	// txTimestampRaw, _ := stub.GetTxTimestamp()
	// seconds, nanos := txTimestampRaw.GetSeconds(), int64(txTimestampRaw.GetNanos())
	// txTimestamp := time.Unix(seconds, nanos).Format("2006-01-02 15:04:05 Mon")
	txTimestamp := t.getTxTimestamp(stub)

	key, err := stub.CreateCompositeKey("grant", []string{patient, txid})
	if err != nil {
		return err
	}
	err = stub.PutState(key, []byte(txTimestamp))
	if err != nil {
		return err
	}
	// err = stub.PutState(txid, []byte("grant$$" + patient + "$$" + doctor + "$$" + txTimestamp))
	// if err != nil {
	// 	return err
	// }
	payload := []byte(doctor + "$$" + patient + "$$" + txid)
	err = stub.SetEvent("hospital", payload)
	if err != nil {
		return err
	}
	return nil
}

func (t *SimpleAsset) grantWithoutSignature(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	//
	// patient  txid  doctor
	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments")
	}
	patient, txid, doctor := args[0], args[1], args[2]

	err := t.doGrant(stub, patient, txid, doctor)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(nil)
}

func (t *SimpleAsset) grantWithSignature(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	//
	// patient  txid  doctor  n  sig
	if len(args) != 5 {
		return shim.Error("Incorrect number of arguments")
	}
	patient, txid, doctor, n, sig := args[0], args[1], args[2], args[3], args[4]

	err := t.doVerifyPatientGrant(stub, patient, txid, doctor, n, sig)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = t.doGrant(stub, patient, txid, doctor)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(nil)
}
