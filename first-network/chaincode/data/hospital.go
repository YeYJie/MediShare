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

func (t *SimpleAsset) newHospital(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	//
	// hospitalName
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments")
	}
	hospital := args[0]
	key, err := stub.CreateCompositeKey("hospitalKey", []string{hospital})
	if err != nil {
		return shim.Error(err.Error())
	}
	val, err := stub.GetState(key)
	if err != nil {
		return shim.Error(err.Error())
	}
	if val != nil {
		return shim.Error("hospital" + hospital + " already exists")
	}

	private, public := t.newRsaKeyPair()
	privateAndPublic := public + "$$" + private

	err = stub.PutState(key, []byte(privateAndPublic))
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success([]byte(privateAndPublic))
}

func (t *SimpleAsset) doGetHospitalPrivateKey(stub shim.ChaincodeStubInterface, hospital string) (string, error) {

	iter, err := stub.GetStateByPartialCompositeKey("hospitalKey", []string{hospital})
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
	return "", errors.New("hospital not found")
}

func (t *SimpleAsset) getHospitalPrivateKey(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	//
	// hospitalName
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments")
	}
	hospital := args[0]
	privateKey, err := t.doGetHospitalPrivateKey(stub, hospital)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success([]byte(privateKey))
}


func (t *SimpleAsset) getHospitalPublicKey(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	//
	// hospital
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments")
	}
	hospital := args[0]
	publicKey, err := t.doGetHospitalPublicKey(stub, hospital)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success([]byte(publicKey))
}

func (t *SimpleAsset) doGetHospitalPublicKey(stub shim.ChaincodeStubInterface, hospital string) (string, error) {

	iter, err := stub.GetStateByPartialCompositeKey("hospitalKey", []string{hospital})
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
	return "", errors.New("hospital not found")
}

func (t *SimpleAsset) doVerifyHospitalSignature(stub shim.ChaincodeStubInterface, hospital, content, sig string) error {

	publicKeyString, err := t.doGetHospitalPublicKey(stub, hospital)
	if err != nil {
		return errors.New("doGetHospitalPublicKey fails")
	}
	block, _ := pem.Decode([]byte(publicKeyString))
	if block == nil {
		return errors.New("pem.Decode")
	}
	publicKeyInterface, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return errors.New("hospital x509.ParsePKIXPublicKey fails" + publicKeyString + "| <- end")
	}
	publicKey := publicKeyInterface.(*rsa.PublicKey)
	hashv := sha256.Sum256([]byte(content))
	signature, _ := hex.DecodeString(sig)
	err = rsa.VerifyPKCS1v15(publicKey, crypto.SHA256, hashv[:], signature)
	if err != nil {
		return errors.New("hospital rsa.VerifyPKCS1v15 fails")
	}
	return nil
}
