package main

import (
	// "fmt"
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
)

func (t *SimpleAsset) register1(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	patient, hospital, doctor, patientTime, patientSig, hospitalTime, hospitalSig := args[0], args[1], args[2], args[3], args[4], args[5], args[6]
	txTimestamp := t.getTxTimestamp(stub)

	patientContent := strings.Join([]string{"register", patient, hospital, doctor, patientTime}, "$$")
	err := t.doVerifyPatientSignature(stub, patient, patientContent, patientSig)
	if err != nil {
		return shim.Error(err.Error())
	}

	hospitalContent := strings.Join([]string{"register", patientSig, hospitalTime}, "$$")
	err = t.doVerifyHospitalSignature(stub, hospital, hospitalContent, hospitalSig)
	if err != nil {
		return shim.Error(err.Error())
	}

	key, err := stub.CreateCompositeKey("register", []string{patient, hospital, doctor})
	if err != nil {
		return shim.Error(err.Error())
	}
	value := strings.Join([]string{"0", patientTime, patientSig, hospitalTime, hospitalSig, txTimestamp}, "$$")

	err = stub.PutState(key, []byte(value))
	if err != nil {
		return shim.Error(err.Error())
	}

	key, err = stub.CreateCompositeKey("onRegister", []string{patient, hospital, doctor})
	if err != nil {
		return shim.Error(err.Error())
	}

	err = stub.PutState(key, []byte(txTimestamp))
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(nil)
}

func (t *SimpleAsset) register2(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	patient, hospital, doctor, patientTime, patientSig, hospitalTime, hospitalSig := args[0], args[1], args[2], args[3], args[4], args[5], args[6]
	txTimestamp := t.getTxTimestamp(stub)

	patientContent := strings.Join([]string{"register", patient, hospital, patientTime}, "$$")
	err := t.doVerifyPatientSignature(stub, patient, patientContent, patientSig)
	if err != nil {
		return shim.Error(err.Error())
	}

	hospitalContent := strings.Join([]string{"register", patientSig, doctor, hospitalTime}, "$$")
	err = t.doVerifyHospitalSignature(stub, hospital, hospitalContent, hospitalSig)
	if err != nil {
		return shim.Error(err.Error())
	}

	key, err := stub.CreateCompositeKey("register", []string{patient, hospital, doctor})
	if err != nil {
		return shim.Error(err.Error())
	}
	value := strings.Join([]string{"1", patientTime, patientSig, hospitalTime, hospitalSig, txTimestamp}, "$$")

	err = stub.PutState(key, []byte(value))
	if err != nil {
		return shim.Error(err.Error())
	}

	key, err = stub.CreateCompositeKey("onRegister", []string{patient, hospital, doctor})
	if err != nil {
		return shim.Error(err.Error())
	}

	err = stub.PutState(key, []byte(txTimestamp))
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(nil)
}

func (t *SimpleAsset) deRegister(stub shim.ChaincodeStubInterface, args	[]string) peer.Response {

	patient, hospital, doctor, patientTime, patientSig := args[0], args[1], args[2], args[3], args[4]
	txTimestamp := t.getTxTimestamp(stub)

	patientContent := strings.Join([]string{"deRegister", patient, hospital, doctor, patientTime}, "$$")
	err := t.doVerifyPatientSignature(stub, patient, patientContent, patientSig)
	if err != nil {
		return shim.Error(err.Error())
	}

	key, err := stub.CreateCompositeKey("deRegister", []string{patient, hospital, doctor})
	if err != nil {
		return shim.Error(err.Error())
	}
	value := strings.Join([]string{patientTime, patientSig, txTimestamp}, "$$")

	err = stub.PutState(key, []byte(value))
	if err != nil {
		return shim.Error(err.Error())
	}

	key, err = stub.CreateCompositeKey("onRegister", []string{patient, hospital, doctor})
	if err != nil {
		return shim.Error(err.Error())
	}
	err = stub.DelState(key)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(nil)
}

func (t *SimpleAsset) doVerifyDoctorProf(stub shim.ChaincodeStubInterface, doctor, hospital, doctorProf string) error {

	content := strings.Join([]string{doctor, hospital}, "$$")
	return t.doVerifyHospitalSignature(stub, hospital, content, doctorProf)
}

func (t *SimpleAsset) request(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	doctor, hospital, patient, targetHospital, recordId, doctorProf, doctorTime, doctorSig := args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]
	txId := stub.GetTxID()
	txTimestamp := t.getTxTimestamp(stub)

	err := t.doVerifyDoctorProf(stub, doctor, hospital, doctorProf)
	if err != nil {
		return shim.Error(err.Error())
	}

	doctorContent := strings.Join([]string{"request", doctorProf, patient, targetHospital, recordId, doctorTime}, "$$")
	err = t.doVerifyDoctorSignature(stub, doctor, doctorContent, doctorSig)
	if err != nil {
		return shim.Error(err.Error())
	}

	key, err := stub.CreateCompositeKey("request", []string{doctor, hospital, patient, targetHospital, recordId})
	if err != nil {
		return shim.Error(err.Error())
	}
	value := strings.Join([]string{doctorProf, doctorTime, doctorSig, txTimestamp}, "$$")
	err = stub.PutState(key, []byte(value))
	if err != nil {
		return shim.Error(err.Error())
	}

	key, err = stub.CreateCompositeKey("onRegister", []string{patient, hospital, doctor})
	if err != nil {
		return shim.Error(err.Error())
	}
	res, err := stub.GetState(key)
	if err != nil {
		return shim.Error(err.Error())
	}
	if res != nil {
		// TODO: verify time res
		key, err := stub.CreateCompositeKey("grant", []string{doctor, patient, targetHospital, recordId})
		if err != nil {
			return shim.Error(err.Error())
		}
		requestRecord := strings.Join([]string{"request", doctor, hospital, patient, targetHospital, recordId}, "$$")
		registerRecord := strings.Join([]string{"register", patient, hospital, doctor}, "$$")
		value = strings.Join([]string{requestRecord, registerRecord, txTimestamp}, "$$$")
		err = stub.PutState(key, []byte(value))
		if err != nil {
			return shim.Error(err.Error())
		}

		eventPayload := strings.Join([]string{doctor, hospital, patient, targetHospital, recordId, txId}, "$$")
		stub.SetEvent(targetHospital, []byte(eventPayload))

		// eventPayload = strings.Join([]string{doctor, hospital, patient, targetHospital, recordId, txId}, "$$")
		stub.SetEvent(doctor, []byte(eventPayload))
	}
	return shim.Success(nil)
}

func (t *SimpleAsset) newRecord(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	hospital, doctor, patient, recordId, hospitalTime, inspection, hospitalSig := args[0], args[1], args[2], args[3], args[4], args[5], args[6]
	txTimestamp := t.getTxTimestamp(stub)

	content := strings.Join([]string{hospital, doctor, patient, recordId, hospitalTime, inspection}, "$$")
	err := t.doVerifyHospitalSignature(stub, hospital, content, hospitalSig)
	if err != nil {
		return shim.Error(err.Error())
	}

	key, err := stub.CreateCompositeKey("record", []string{patient, hospital, doctor, recordId})
	if err != nil {
		return shim.Error(err.Error())
	}
	value := strings.Join([]string{hospitalTime, inspection, hospitalSig, txTimestamp}, "$$")
	err = stub.PutState(key, []byte(value))
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(nil)
}

func (t *SimpleAsset) getPatientRecord(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	doctor, hospital, patient, doctorProf, doctorTime, doctorSig := args[0], args[1], args[2], args[3], args[4], args[5]

	err := t.doVerifyDoctorProf(stub, doctor, hospital, doctorProf)
	if err != nil {
		return shim.Error(err.Error())
	}

	content := strings.Join([]string{doctorProf, patient, doctorTime}, "$$")
	err = t.doVerifyDoctorSignature(stub, doctor, content, doctorSig)
	if err != nil {
		return shim.Error(err.Error())
	}

	iter, err := stub.GetStateByPartialCompositeKey("record", []string{patient})
	if err != nil {
		return shim.Error(err.Error())
	}
	result := ""
	for iter.HasNext() {
		kv, err := iter.Next()
		if err != nil {
			break;
		}

		_, keyTokens, err := stub.SplitCompositeKey(kv.Key)
		if err != nil {
			break;
		}
		result += strings.Join([]string{keyTokens[1], keyTokens[2], keyTokens[3]}, ", ")
		result += ", "
		valueTokens := strings.Split(string(kv.Value), "$$")
		result += strings.Join([]string{valueTokens[0], valueTokens[1]}, ", ")

		result += "\n"
	}
	return shim.Success([]byte(result))
}
