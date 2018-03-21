package main

import (
	// "errors"
	"encoding/json"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

func (t *SimpleAsset) verifySignature(stub shim.ChaincodeStubInterface,
		sigContent string, sig string, PKC string) error {

	return nil
}

func (t *SimpleAsset) insertIndex(stub shim.ChaincodeStubInterface, err error,
			keyComponents []string, value string) error {
	if err != nil {
		return err
	}
	key, err := stub.CreateCompositeKey(keyComponents[0], keyComponents[1:])
	if err != nil {
		return err
	}
	err = stub.PutState(key, []byte(value))
	return err
}

func (t *SimpleAsset) getRegistertId(stub shim.ChaincodeStubInterface,
			patient, doctor, hospital, patientTime, hospitalTime string) string {
	return ""
}

func (t *SimpleAsset) register(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	var registerArgs RegisterArgs
	err := json.Unmarshal([]byte(args[0]), &registerArgs)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = t.verifySignature(stub, registerArgs.GetPatientSigContent(),
			registerArgs.PatientSig, registerArgs.PatientPKC)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = t.verifySignature(stub, registerArgs.GetHospitalSigContent(),
			registerArgs.HospitalSig, registerArgs.HospitalPKC)
	if err != nil {
		return shim.Error(err.Error())
	}

	registertId := t.getRegistertId(stub, registerArgs.Patient, registerArgs.Doctor,
		registerArgs.Hospital, registerArgs.PatientTime, registerArgs.HospitalTime)

	err = stub.PutState(registertId, []byte(args[0]))
	if err != nil {
		return shim.Error(err.Error())
	}

	txTimestamp := t.getTxTimestampSecond(stub)

	err = t.insertIndex(stub, err, []string{"index1", registerArgs.Patient, txTimestamp}, registertId)
	err = t.insertIndex(stub, err, []string{"index2", registerArgs.Doctor, txTimestamp}, registertId)
	err = t.insertIndex(stub, err, []string{"index3", registerArgs.Hospital, txTimestamp}, registertId)
	if err != nil {
		return shim.Error(err.Error())
	}

	key, err := stub.CreateCompositeKey("onRegister", []string{registerArgs.Patient})
	if err != nil {
		return shim.Error(err.Error())
	}

	err = stub.PutState(key, []byte(registertId))
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(nil)
}

func (t *SimpleAsset) deRegister2(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	var deRegisterArgs DeRegisterArgs
	err := json.Unmarshal([]byte(args[0]), &deRegisterArgs)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = t.verifySignature(stub, deRegisterArgs.GetPatientSigContent(),
				deRegisterArgs.PatientSig, deRegisterArgs.PatientPKC)
	if err != nil {
		return shim.Error(err.Error())
	}

	key, err := stub.CreateCompositeKey("onRegister", []string{deRegisterArgs.Patient})
	if err != nil {
		return shim.Error(err.Error())
	}

	registerIdByte, err := stub.GetState(key)
	if err != nil {
		return shim.Error(err.Error())
	}
	if registerIdByte == nil {
		return shim.Error("patient not registered")
	}

	err = stub.DelState(key)
	if err != nil {
		return shim.Error(err.Error())
	}

	key, err = stub.CreateCompositeKey("deRegister", []string{string(registerIdByte)})
	if err != nil {
		return shim.Error(err.Error())
	}

	err = stub.PutState(key, []byte(args[0]))
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(nil)
}

func (t *SimpleAsset) getRecordId(stub shim.ChaincodeStubInterface,
			patient, doctor, hospital, recordId, hospitalTime string) string {
	return ""
}

func (t *SimpleAsset) newRecord2(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	var newRecordArgs NewRecordArgs
	err := json.Unmarshal([]byte(args[0]), &newRecordArgs)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = t.verifySignature(stub, newRecordArgs.GetHospitalSigContent(),
			newRecordArgs.HospitalSig, newRecordArgs.HospitalPKC)
	if err != nil {
		return shim.Error(err.Error())
	}

	recordId := t.getRecordId(stub, newRecordArgs.Patient, newRecordArgs.Doctor,
				newRecordArgs.Hospital, newRecordArgs.RecordId, newRecordArgs.HospitalTime)

	err = stub.PutState(recordId, []byte(args[0]))
	if err != nil {
		return shim.Error(err.Error())
	}

	txTimestamp := t.getTxTimestampSecond(stub)

	err = t.insertIndex(stub, err, []string{"index4", newRecordArgs.Patient, txTimestamp}, recordId)
	err = t.insertIndex(stub, err, []string{"index5", newRecordArgs.Doctor, txTimestamp}, recordId)
	err = t.insertIndex(stub, err, []string{"index6", newRecordArgs.Hospital, txTimestamp}, recordId)
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(nil)
}

func (t *SimpleAsset) getRequestId(stub shim.ChaincodeStubInterface,
			doctor, patient, hospital, recordId, requestTime string) string {
	return ""
}

func (t *SimpleAsset) requestDetail(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	var requestDetailArgs RequestDetailArgs
	err := json.Unmarshal([]byte(args[0]), &requestDetailArgs)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = t.verifySignature(stub, requestDetailArgs.GetDoctorSigContent(),
			requestDetailArgs.DoctorSig, requestDetailArgs.DoctorPKC)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = t.verifySignature(stub, requestDetailArgs.GetDoctorProfContent(),
			requestDetailArgs.DoctorProf, requestDetailArgs.HospitalPKC)
	if err != nil {
		return shim.Error(err.Error())
	}

	key, err := stub.CreateCompositeKey("onRegister", []string{requestDetailArgs.Patient})
	if err != nil {
		return shim.Error(err.Error())
	}
	value, err := stub.GetState(key)
	if err != nil {
		return shim.Error(err.Error())
	}
	if value == nil {
		return shim.Error(err.Error())
	}

	requestId := t.getRequestId(stub, requestDetailArgs.Doctor, requestDetailArgs.Patient,
				requestDetailArgs.Hospital, requestDetailArgs.RecordId, requestDetailArgs.RequestTime)

	err = stub.PutState(requestId, []byte(args[0]))
	if err != nil {
		return shim.Error(err.Error())
	}

	txTimestamp := t.getTxTimestampSecond(stub)

	err = t.insertIndex(stub, err, []string{"index7", requestDetailArgs.Doctor, txTimestamp}, requestId)
	err = t.insertIndex(stub, err, []string{"index8", requestDetailArgs.Patient, txTimestamp}, requestId)
	if err != nil {
		return shim.Error(err.Error())
	}

	type RequestGrant struct {
		RequestDoctor		string
		RequestHospital		string
		Patient				string
		TargetHospital		string
		RecordId			string
		TxId 				string
	}

	requestGrant := RequestGrant{
		RequestDoctor		: requestDetailArgs.Doctor,
		RequestHospital		: requestDetailArgs.Hospital,
		Patient				: requestDetailArgs.Patient,
		TargetHospital		: requestDetailArgs.TargetHospital,
		RecordId			: requestDetailArgs.RecordId,
		TxId 				: stub.GetTxID(),
	}
	requestGrantJson, err := json.Marshal(requestGrant)
	if err != nil {
		return shim.Error(err.Error())
	}

	stub.SetEvent(requestDetailArgs.TargetHospital, requestGrantJson)
	stub.SetEvent(requestDetailArgs.Doctor, requestGrantJson)

	return shim.Success(nil)
}

// build PatientRecordSummary using index4
func (t *SimpleAsset) getRecord(stub shim.ChaincodeStubInterface,
				key string, value string) (PatientRecordSummary, error) {

	var patientRecordSummary PatientRecordSummary
	_, keyTokens, _ := stub.SplitCompositeKey(key)
	recordByte, err := stub.GetState(value)
	if err != nil {
		return patientRecordSummary, err
	}
	var newRecordArgs NewRecordArgs
	err = json.Unmarshal(recordByte, &newRecordArgs)
	if err != nil {
		return patientRecordSummary, err
	}
	patientRecordSummary.Hospital = newRecordArgs.Hospital
	patientRecordSummary.Doctor = newRecordArgs.Doctor
	patientRecordSummary.Inspection = newRecordArgs.Inspection
	patientRecordSummary.RecordId = value
	patientRecordSummary.RecordTime = keyTokens[1]
	return patientRecordSummary, nil
}

func (t *SimpleAsset) getPatientRecords(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	var getPatientRecordsArgs GetPatientRecordsArgs
	err := json.Unmarshal([]byte(args[0]), &getPatientRecordsArgs)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = t.verifySignature(stub, getPatientRecordsArgs.GetDoctorSigContent(),
			getPatientRecordsArgs.DoctorSig, getPatientRecordsArgs.DoctorPKC)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = t.verifySignature(stub, getPatientRecordsArgs.GetDoctorProfContent(),
			getPatientRecordsArgs.DoctorProf, getPatientRecordsArgs.HospitalPKC)
	if err != nil {
		return shim.Error(err.Error())
	}

	iter, err := stub.GetStateByPartialCompositeKey("index4",
							[]string{getPatientRecordsArgs.Patient})
	if err != nil {
		return shim.Error(err.Error())
	}

	var getPatientRecordsReply GetPatientRecordsReply
	for iter.HasNext() {
		kv, _ := iter.Next()
		record, err := t.getRecord(stub, kv.Key, string(kv.Value))
		if err != nil {
			break;
		}
		getPatientRecordsReply.Records = append(getPatientRecordsReply.Records, record)
	}
	getPatientRecordsReplyJson, err := json.Marshal(getPatientRecordsReply)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(getPatientRecordsReplyJson)
}
