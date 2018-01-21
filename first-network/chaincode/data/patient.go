package main

import (
	// "fmt"
	// "strconv"
	"crypto"
	"crypto/rsa"
	// "crypto/rand"
	"crypto/x509"
	"crypto/sha256"
	"strings"
	"errors"
	"encoding/pem"
	"encoding/hex"
	// "time"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

// for debug use
// create a new patient and return its **private** key
func (t *SimpleAsset) newPatient(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	//
	// patientName
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments")
	}
	patient := args[0]
	key, err := stub.CreateCompositeKey("patientKey", []string{patient})
	if err != nil {
		return shim.Error(err.Error())
	}
	val, err := stub.GetState(key)
	if err != nil {
		return shim.Error(err.Error())
	}
	if val != nil {
		return shim.Error("patient" + patient + " already exists")
	}

	private, public := t.newRsaKeyPair()
	privateAndPublic := public + "$$" + private

	err = stub.PutState(key, []byte(privateAndPublic))
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success([]byte(privateAndPublic))
}

func (t *SimpleAsset) doGetPatientPrivateKey(stub shim.ChaincodeStubInterface, patient string) (string, error) {

	iter, err := stub.GetStateByPartialCompositeKey("patientKey", []string{patient})
	if err != nil {
		return "", err
	}
	for iter.HasNext() {
		kv, err := iter.Next()
		if err != nil {
			return "", err
		}
		privateKey := strings.Split(string(kv.Value), "$$")[1]
		return privateKey, nil
	}
	return "", errors.New("patient not found")
}

func (t *SimpleAsset) getPatientPrivateKey(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	//
	// patientName
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments")
	}
	patient := args[0]
	privateKey, err := t.doGetPatientPrivateKey(stub, patient)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success([]byte(privateKey))
}

func (t *SimpleAsset) doGetPatientPublicKey(stub shim.ChaincodeStubInterface, patient string) (string, error) {

	iter, err := stub.GetStateByPartialCompositeKey("patientKey", []string{patient})
	if err != nil {
		return "", err
	}
	for iter.HasNext() {
		kv, err := iter.Next()
		if err != nil {
			return "", err
		}
		publicKey := strings.Split(string(kv.Value), "$$")[0]
		return publicKey, nil
	}
	return "", errors.New("patient not found")
}

func (t *SimpleAsset) getPatientPublicKey(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	//
	// patient
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments")
	}
	patient := args[0]
	publicKey, err := t.doGetPatientPublicKey(stub, patient)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success([]byte(publicKey))
}

func (t *SimpleAsset) doVerifyPatientSignature(stub shim.ChaincodeStubInterface, patient, content, sig string) error {

	publicKeyString, err := t.doGetPatientPublicKey(stub, patient)
	if err != nil {
		return errors.New("doGetPatientPublicKey fails")
	}
	block, _ := pem.Decode([]byte(publicKeyString))
	if block == nil {
		return errors.New("pem.Decode")
	}
	publicKeyInterface, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return errors.New("patient x509.ParsePKIXPublicKey fails" + publicKeyString + "| <- end")
	}
	publicKey := publicKeyInterface.(*rsa.PublicKey)
	hashv := sha256.Sum256([]byte(content))
	signature, _ := hex.DecodeString(sig)
	err = rsa.VerifyPKCS1v15(publicKey, crypto.SHA256, hashv[:], signature)
	if err != nil {
		return errors.New("patient rsa.VerifyPKCS1v15 fails")
	}
	return nil
}

func (t *SimpleAsset) doVerifyPatientGrant(stub shim.ChaincodeStubInterface, patient, txid, doctor, n, sig string) error {

	content := patient + "$$" + txid + "$$" + doctor + "$$" + n
	return t.doVerifyPatientSignature(stub, patient, content, sig)
}

func (t *SimpleAsset) doGetPatientRequests(stub shim.ChaincodeStubInterface, patient string) (string, error) {

	res := ""
	iter, err := stub.GetStateByPartialCompositeKey("patient", []string{patient})
	if err != nil {
		return res, err
	}
	for iter.HasNext() {
		kv, _ := iter.Next()
		// t.debug("%v -> %v", kv.Key, string(kv.Value))
		_, attributes, err := stub.SplitCompositeKey(kv.Key)
		if err != nil {
			return "", err
		}
		txid := attributes[1]
		valueStringArr := strings.Split(string(kv.Value), "$$")
		doctor, txTimestamp := valueStringArr[0], valueStringArr[1]
		requestStatus, err := t.doGetRequestStatus(stub, txid, patient)
		if err != nil {
			return "", err
		}
		res += txid + " " + doctor + " " + txTimestamp + " " + requestStatus + "\n"
	}
	return res, nil
}

func (t *SimpleAsset) getPatientRequests(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	//
	// patient
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments")
	}
	patient := args[0]
	res, err := t.doGetPatientRequests(stub, patient)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success([]byte(res))
}
