package main

import (
	// "fmt"
	"strconv"
	// "crypto"
	// "crypto/rsa"
	// "crypto/rand"
	// "crypto/x509"
	// "crypto/sha256"
	// "strings"
	// "errors"
	// "encoding/pem"
	// "encoding/hex"
	"time"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	// "github.com/hyperledger/fabric/protos/peer"
)

// func (t *SimpleAsset) debugImpl(str string) {
// 	fmt.Printf("%s\n", str)
// }

// func (t *SimpleAsset) debug(format string, a ...interface{}) {
// 	t.debugImpl(fmt.Sprintf(format, a...))
// }

// func (t *SimpleAsset) echo(stub shim.ChaincodeStubInterface, args []string) peer.Response {

// 	return shim.Success([]byte(args[0] + help()))
// }

// func (t *SimpleAsset) sleep(stub shim.ChaincodeStubInterface, args []string) peer.Response {
// 	duration := byteArrayToInt([]byte(args[0]))
// 	time.Sleep(time.Duration(duration) * time.Second)
// 	return shim.Success(nil)
// }

// func byteArrayToInt(arr []byte) int {
// 	ret, _ := strconv.Atoi(string(arr))
// 	return ret
// }

// func intToByteArray(num int) []byte {
// 	return []byte(strconv.Itoa(num))
// }

// func (t *SimpleAsset) triggerEvent(stub shim.ChaincodeStubInterface, args []string) peer.Response {

// 	// args
// 	// 0				1
// 	// eventName 	payload

// 	if len(args) < 2 {
// 		return shim.Error("trigger Incorrect number of arguments")
// 	}
// 	name := args[0]
// 	payload := []byte(args[1])
// 	err := stub.SetEvent(name, payload)
// 	if err != nil {
// 		return shim.Error(err.Error())
// 	}
// 	return shim.Success(nil)
// }

// func (t *SimpleAsset) twoEvent(stub shim.ChaincodeStubInterface, args []string) peer.Response {
// 	_ = stub.SetEvent("hospital", []byte("yeyongjie"))
// 	_ = stub.SetEvent("doctor", []byte("ndc"))
// 	return shim.Success(nil)
// }

// func (t *SimpleAsset) myverify(stub shim.ChaincodeStubInterface, args []string) peer.Response {

// 	doctor, patient, n, sig := args[0], args[1], args[2], args[3]
// 	err := t.doVerifyDoctorRequest(stub, doctor, patient, n, sig)
// 	if err != nil {
// 		return shim.Error(err.Error())
// 	} else {
// 		return shim.Success([]byte("verify success"))
// 	}
// }

// // return a new pair of rsa private-public key
// func (t *SimpleAsset) newRsaKeyPair() (private, public string) {
// 	privateKey, _ := rsa.GenerateKey(rand.Reader, 2048)
// 	pemdata := pem.EncodeToMemory(
// 	    &pem.Block{
// 	        Type: "RSA PRIVATE KEY",
// 	        Bytes: x509.MarshalPKCS1PrivateKey(privateKey),
// 	    },
// 	)
// 	temp, _ := x509.MarshalPKIXPublicKey(&privateKey.PublicKey)
// 	pubBytes := pem.EncodeToMemory(
// 		&pem.Block{
// 			Type:  "RSA PUBLIC KEY",
// 			Bytes: temp,
// 		},
// 	)
// 	private = string(pemdata)
// 	public = string(pubBytes)
// 	return private, public
// }


func (t *SimpleAsset) getTxTimestamp(stub shim.ChaincodeStubInterface) string {

	txTimestampRaw, _ := stub.GetTxTimestamp()
	seconds, nanos := txTimestampRaw.GetSeconds(), int64(txTimestampRaw.GetNanos())
	txTimestamp := time.Unix(seconds, nanos).Format("2006-01-02 15:04:05")
	return txTimestamp
}

func (t *SimpleAsset) getTxTimestampSecond(stub shim.ChaincodeStubInterface) string {

	txTimestampRaw, _ := stub.GetTxTimestamp()
	seconds := txTimestampRaw.GetSeconds()
	return strconv.FormatInt(seconds, 10)
}
