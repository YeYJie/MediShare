package main

import (
	"fmt"
	// "strconv"
	// "crypto"
	// "crypto/rsa"
	// "crypto/rand"
	// "crypto/x509"
	// "crypto/sha256"
	"strings"
	// "errors"
	// "encoding/pem"
	// "encoding/hex"
	// "time"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
	"encoding/json"
)


type SimpleAsset struct {
}

func main() {
	if err := shim.Start(new(SimpleAsset)); err != nil {
		fmt.Printf("Error starting SimpleAsset chaincode: %s", err)
	}
}

func (t *SimpleAsset) Init(stub shim.ChaincodeStubInterface) peer.Response {
	t.newDoctor(stub, []string{"d1"})
	t.newPatient(stub, []string{"p1"})
	t.newHospital(stub, []string{"h1"})
	return shim.Success(nil)
}

func (t *SimpleAsset) pk(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	p, _ := t.doGetPatientPrivateKey(stub, "p1")
	return shim.Success([]byte(p))
}

func (t *SimpleAsset) hk(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	p, _ := t.doGetHospitalPrivateKey(stub, "h1")
	return shim.Success([]byte(p))
}

func (t *SimpleAsset) dk(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	p, _ := t.doGetDoctorPrivateKey(stub, "d1")
	return shim.Success([]byte(p))
}

func (t *SimpleAsset) k(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	return shim.Success(nil)
}

func (t *SimpleAsset) appendkv(stub shim.ChaincodeStubInterface, iter shim.StateQueryIteratorInterface, dst string) string {
	for iter.HasNext() {
		kv, _ := iter.Next()
		object, attrib, _ := stub.SplitCompositeKey(kv.Key)
		// res += kv.Key + " -> " + string(kv.Value) + "\n"
		dst += object + " " + strings.Join(attrib, " ") + "  ->  " + string(kv.Value) + "\n"
	}
	return dst;
}

func (t *SimpleAsset) all(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	res := ""
	iter, _ := stub.GetStateByPartialCompositeKey("register", []string{})
	res = t.appendkv(stub, iter, res)
	// for iter.HasNext() {
	// 	kv, _ := iter.Next()
	// 	res += kv.Key + " -> " + string(kv.Value) + "\n"
	// }
	iter, _ = stub.GetStateByPartialCompositeKey("onRegister", []string{})
	res = t.appendkv(stub, iter, res)
	// for iter.HasNext() {
	// 	kv, _ := iter.Next()
	// 	res += kv.Key + " -> " + string(kv.Value) + "\n"
	// }
	iter, _ = stub.GetStateByPartialCompositeKey("deRegister", []string{})
	res = t.appendkv(stub, iter, res)
	// for iter.HasNext() {
	// 	kv, _ := iter.Next()
	// 	res += kv.Key + " -> " + string(kv.Value) + "\n"
	// }
	iter, _ = stub.GetStateByPartialCompositeKey("request", []string{})
	res = t.appendkv(stub, iter, res)
	// for iter.HasNext() {
	// 	kv, _ := iter.Next()
	// 	res += kv.Key + " -> " + string(kv.Value) + "\n"
	// }
	iter, _ = stub.GetStateByPartialCompositeKey("grant", []string{})
	res = t.appendkv(stub, iter, res)
	// for iter.HasNext() {
	// 	kv, _ := iter.Next()
	// 	res += kv.Key + " -> " + string(kv.Value) + "\n"
	// }
	iter, _ = stub.GetStateByPartialCompositeKey("record", []string{})
	res = t.appendkv(stub, iter, res)
	// for iter.HasNext() {
	// 	kv, _ := iter.Next()
	// 	res += kv.Key + " -> " + string(kv.Value) + "\n"
	// }
	return shim.Success([]byte(res))
}

func (t *SimpleAsset) Invoke(stub shim.ChaincodeStubInterface) peer.Response {

	function, args := stub.GetFunctionAndParameters()
	fmt.Println("invoke is running " + function)

	if function == "pk" {
		return t.pk(stub, args)
	} else if function == "hk" {
		return t.hk(stub, args)
	} else if function == "dk" {
		return t.dk(stub, args)
	} else if function == "k" {
		return t.k(stub, args)
	} else if function == "all" {
		return t.all(stub, args)
	} else if function == "setevent" {
		// for debug use, trigger event
		return t.triggerEvent(stub, args)
	} else if function == "echo" {
		// for debug use, echo
		return t.echo(stub, args)
	} else if function == "sleep" {
		return t.sleep(stub, args)
	} else if function == "requestshit" {					// request
		// return t.requestWithoutSignature(stub, args)
	} else if function == "requestsig" {
		// return t.requestWithSignature(stub, args)
	} else if function == "requestWithPatientGrant" {
		// return t.requestWithPatientGrant(stub, args)
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
	} else if function == "register1" {
		return t.register1(stub, args)
	} else if function == "register2" {
		return t.register2(stub, args)
	} else if function == "deRegister" {
		return t.deRegister(stub, args)
	} else if function == "request" {
		return t.request(stub, args)
	} else if function == "newRecord" {
		return t.newRecord(stub, args)
	} else if function == "getPatientRecord" {
		return t.getPatientRecord(stub, args)
	} else if function == "newHospital" {
		return t.newHospital(stub, args)
	} else if function == "getHospitalPrivateKey" {
		return t.getHospitalPrivateKey(stub, args)
	} else if function == "getHospitalPublicKey" {
		return t.getHospitalPublicKey(stub, args)
	} else if function == "json" {
		return t.json(stub, args)
	}

	fmt.Println("invoke did not find func: " + function) //error
	return shim.Error("Received unknown function invocation")
}

func (t *SimpleAsset) json(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// return shim.Error(string(args[0]))
	type jsonType struct {
		Ye	string
		Yong string
	}
	var temp jsonType
	err := json.Unmarshal([]byte(args[0]), &temp)
	if err != nil {
		return shim.Error("failed to json.Unmarshal: " + err.Error())
	}
	// err = stub.PutState("json", []byte(temp.ye + temp.yong))
	return shim.Success([]byte(temp.Ye + temp.Yong))
}
