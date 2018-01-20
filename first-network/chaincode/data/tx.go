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

// if the tx has been granted, then return  "doctor  patient  doctorRequestTimestamp  patientGrantTimestamp"
// else return "doctor  patient  doctorRequestTimestamp"
func (t *SimpleAsset) getInfoAboutTx(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	//
	// txid
	// if len(args) != 1 {
	// 	return shim.Error("Incorrect number of arguments")
	// }
	// txid := args[0]

	// requestInfo, err := stub.GetState(txid)
	// if err != nil {
	// 	return shim.Error(err.Error())
	// }
	// if requestInfo == nil {
	// 	return shim.Success([]byte("transaction not exists"))
	// }

	// requestInfoAfterSplit := strings.Split(string(requestInfo), "$$")
	// if len(requestInfoAfterSplit) != 4 {
	// 	return shim.Error("getInfoFromTxid len(requestInfoAfterSplit) != 4")
	// }
	// result := requestInfoAfterSplit[1] + " "
	// 			+ requestInfoAfterSplit[2] + " "
	// 			+ requestInfoAfterSplit[3] + " "

	// key, err := stub.CreateCompositeKey("grant", []string{txid})
	// if err != nil {
	// 	return shim.Error(err.Error())
	// }
	// grantInfo, err := stub.GetState(key)
	// if err != nil {
	// 	return shim.Error(err.Error())
	// }
	// if grantInfo == nil {
	// 	return shim.Success([]byte(result))
	// } else {
	// 	result += string(grantInfo)
	// 	return shim.Success([]byte(result))
	// }
	return shim.Success(nil)
}
