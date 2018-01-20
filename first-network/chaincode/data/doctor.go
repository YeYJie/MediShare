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
// create a new doctor and return its **private** key
func (t *SimpleAsset) newDoctor(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	//
	// doctorName
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments")
	}
	doctor := args[0]
	key, err := stub.CreateCompositeKey("doctorKey", []string{doctor})
	if err != nil {
		return shim.Error(err.Error())
	}
	val, err := stub.GetState(key)
	if err != nil {
		return shim.Error(err.Error())
	}
	if val != nil {
		return shim.Error("doctor" + doctor + " already exists")
	}

	private, public := t.newRsaKeyPair()
	privateAndPublic := public + "$$" + private

	err = stub.PutState(key, []byte(privateAndPublic))
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success([]byte(privateAndPublic))
}

// for debug use
func (t *SimpleAsset) getDoctorPrivateKey(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	//
	// doctorName
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments")
	}
	doctor := args[0]
	iter, err := stub.GetStateByPartialCompositeKey("doctorKey", []string{doctor})
	if err != nil {
		return shim.Error(err.Error())
	}
	for iter.HasNext() {
		kv, err := iter.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		privateKey := strings.Split(string(kv.Value), "$$")[1]
		return shim.Success([]byte(privateKey))
	}
	return shim.Error("doctor not exists")
}

func (t *SimpleAsset) doGetDoctorPublicKey(stub shim.ChaincodeStubInterface, doctor string) (string, error) {

	iter, err := stub.GetStateByPartialCompositeKey("doctorKey", []string{doctor})
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
	return "", errors.New("doctor not found")
}

func (t *SimpleAsset) getDoctorPublicKey(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	//
	// doctorName
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments")
	}
	doctor := args[0]
	publicKey, err := t.doGetDoctorPublicKey(stub, doctor)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success([]byte(publicKey))
}

func (t * SimpleAsset) doVerifyDoctorSignature(stub shim.ChaincodeStubInterface, doctor, content, sig string) error {

	publicKeyString, err := t.doGetDoctorPublicKey(stub, doctor)
	if err != nil {
		return errors.New("doGetDoctorPublicKey fails")
	}
	block, _ := pem.Decode([]byte(publicKeyString))
	if block == nil {
		return errors.New("pem.Decode")
	}
	publicKeyInterface, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return errors.New("x509.ParsePKIXPublicKey fails" + publicKeyString + "|||||")
	}
	publicKey := publicKeyInterface.(*rsa.PublicKey)
	hashv := sha256.Sum256([]byte(content))
	signature, _ := hex.DecodeString(sig)
	err = rsa.VerifyPKCS1v15(publicKey, crypto.SHA256, hashv[:], signature)
	if err != nil {
		return errors.New("rsa.VerifyPKCS1v15 fails")
	}
	return nil
}

func (t *SimpleAsset) doVerifyDoctorRequest(stub shim.ChaincodeStubInterface, doctor, patient, n, sig string) error {

	content := doctor + "$$" + patient + "$$" + n
	return t.doVerifyDoctorSignature(stub, doctor, content, sig)
}


func (t *SimpleAsset) doGetRequestStatus(stub shim.ChaincodeStubInterface, txid, patient string) (string, error) {

	key, err := stub.CreateCompositeKey("grant", []string{patient, txid})
	if err != nil {
		return "", err
	}
	grantRecord, err := stub.GetState(key)
	if err != nil {
		return "", err
	}
	if grantRecord == nil {
		return "pending", nil
	}
	// TODO: can we return directly?
	return "granted at " + string(grantRecord), nil
}

func (t *SimpleAsset) doGetDoctorAllRequests(stub shim.ChaincodeStubInterface, doctor string) (string, error) {

	res := ""
	iter, err := stub.GetStateByPartialCompositeKey("request", []string{doctor})
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
		patient, txid, txTimestamp := attributes[1], attributes[2], string(kv.Value)
		requestStatus, err := t.doGetRequestStatus(stub, txid, patient)
		if err != nil {
			return "", err
		}
		res += patient + " " + txid + " " + txTimestamp + " " + requestStatus + "\n"
	}
	return res, nil
}

func (t *SimpleAsset) getDoctorAllRequests(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	//
	// doctor
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments")
	}
	doctor := args[0]
	res, err := t.doGetDoctorAllRequests(stub, doctor)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success([]byte(res))
}

func (t *SimpleAsset) getDoctorAllRequestsWithSig(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	//
	// doctor  n  doctorSignature
	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments")
	}
	doctor, n, sig := args[0], args[1], args[2]

	content := doctor + "$$" + n
	err := t.doVerifyDoctorSignature(stub, doctor, content, sig)
	if err != nil {
		return shim.Error(err.Error())
	}

	res, err := t.doGetDoctorAllRequests(stub, doctor)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success([]byte(res))
}


func (t *SimpleAsset) doGetDoctorRequestsToPatient(stub shim.ChaincodeStubInterface, doctor, patient string) (string, error) {

	res := ""
	iter, err := stub.GetStateByPartialCompositeKey("request", []string{doctor, patient})
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
		// res += attributes[2] + " " + string(kv.Value) + "\n"
		txid, txTimestamp := attributes[2], string(kv.Value)
		requestStatus, err := t.doGetRequestStatus(stub, txid, patient)
		if err != nil {
			return "", err
		}
		res += txid + " " + txTimestamp + " " + requestStatus + "\n"
	}
	return res, nil
}

func (t *SimpleAsset) getDoctorRequestsToPatient(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	//
	// doctor  patient
	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments")
	}
	doctor, patient := args[0], args[1]
	res, err := t.doGetDoctorRequestsToPatient(stub, doctor, patient)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success([]byte(res))
}

func (t *SimpleAsset) getDoctorRequestsToPatientWithSig(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	//
	// doctor  patient  n  doctorSignature
	if len(args) != 4 {
		return shim.Error("Incorrect number of arguments")
	}
	doctor, patient, n, sig := args[0], args[1], args[2], args[3]

	content := doctor + "$$" + patient + "$$" + n
	err := t.doVerifyDoctorSignature(stub, doctor, content, sig)
	if err != nil {
		return shim.Error(err.Error())
	}

	res, err := t.doGetDoctorRequestsToPatient(stub, doctor, patient)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success([]byte(res))
}
