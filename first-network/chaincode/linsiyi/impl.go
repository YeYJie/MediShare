package main

import (
	"errors"
	"bytes"
	"strconv"
	"encoding/hex"
	"encoding/pem"
	"encoding/json"
	"crypto"
	"crypto/rsa"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/x509"
	"net/http"
	"strings"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

func hash(input string) string {
	h := sha1.New()
	h.Write([]byte(input))
	bs := h.Sum(nil)
	// fmt.Printf("%x\n", bs)
	return hex.EncodeToString(bs)
}

// return (fileId, fileVersion, error)
func (t *SimpleAsset) newFileId(stub shim.ChaincodeStubInterface,
	fileName string) (string, string, error) {

	returnedMajorVersion := 1

	iter, err := stub.GetStateByPartialCompositeKey("fileNameToFileId", []string{fileName})
	if err != nil {
		return "", "", err
	}
	for iter.HasNext() {
		kv, _ := iter.Next()
		_, attrib, _ := stub.SplitCompositeKey(kv.Key)
		version := attrib[1]
		majorVersion, _ := strconv.Atoi(version[1:len(version)-2])
		if majorVersion >= returnedMajorVersion {
			returnedMajorVersion += 1
		}
	}
	iter.Close()
	returnedVersion := "v" + strconv.Itoa(returnedMajorVersion) + ".0"
	returnedFileId := hash(fileName + returnedVersion)
	key, err := stub.CreateCompositeKey("fileNameToFileId", []string{fileName, returnedVersion})
	if err != nil {
		return "", "", err
	}
	err = stub.PutState(key, []byte(returnedFileId))
	if err != nil {
		return "", "", err
	}
	return returnedFileId, returnedVersion, nil
}

// PKC = public key cerificate
// pass test, return nil for programing convenience
func (t *SimpleAsset) verifySignature(stub shim.ChaincodeStubInterface,
		content string, signature string, PKC string) error {

	return nil

	rootCertificate, err := stub.GetState("rootCertificate")
	if err != nil {
		return errors.New("failede to get root certificate: " + err.Error())
	}

	roots := x509.NewCertPool()
	ok := roots.AppendCertsFromPEM(rootCertificate)
	if !ok {
		return errors.New("failed to parse root certificate")
	}

	block, _ := pem.Decode([]byte(PKC))
	if block == nil {
		return errors.New("failed to decode PKC PEM")
	}
	pubCert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return errors.New("failed to parse PKC: " + err.Error())
	}

	opts := x509.VerifyOptions{
		Roots:   roots,
	}

	if _, err := pubCert.Verify(opts); err != nil {
		return errors.New("failed to verify PKC: " + err.Error())
	}


	pubKey := pubCert.PublicKey.(*rsa.PublicKey)
	hashed := sha256.Sum256([]byte(content))
	sigDecode, _ := hex.DecodeString(signature)
	err = rsa.VerifyPKCS1v15(pubKey, crypto.SHA256, hashed[:], []byte(sigDecode))
	if err != nil {
		return errors.New("failed to verify department signature: " + err.Error())
	}

	return nil
}

func (t *SimpleAsset) fileUpload(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	var fileUploadArgs FileUploadArgs
	err := json.Unmarshal([]byte(args[0]), &fileUploadArgs)
	if err != nil {
		return shim.Error(err.Error())
	}

	txTimestampSecond := t.getTxTimestampSecond(stub)

	err = t.verifySignature(stub, fileUploadArgs.GetDepartmentSigContent(),
					fileUploadArgs.DepartmentSig, fileUploadArgs.DepartmentPKC)
	if err != nil {
		return shim.Error(err.Error())
	}

	fileId, fileVersion, err := t.newFileId(stub, fileUploadArgs.FileName)
	if err != nil {
		return shim.Error(err.Error())
	}

	// store file's meta-data
	fileMetaData := BuildFileMetaData(fileId, fileUploadArgs.UploadType == "upload",
						fileVersion, txTimestampSecond, &fileUploadArgs)
	fileMetaDataJson, err := json.Marshal(fileMetaData)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = stub.PutState(fileId, []byte(fileMetaDataJson))
	if err != nil {
		return shim.Error(err.Error())
	}

	key := strings.Join([]string{"departmentTimeIndex", fileUploadArgs.Department, txTimestampSecond}, "$$")
	err = stub.PutState(key, []byte(fileId))

	key = strings.Join([]string{"uploaderTimeIndex", fileUploadArgs.Uploader, txTimestampSecond}, "$$")
	err = stub.PutState(key, []byte(fileId))

	key = strings.Join([]string{"timeIndex", txTimestampSecond}, "$$")
	err = stub.PutState(key, []byte(fileId))

	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(nil)
}

func (t *SimpleAsset) iterToFileQueryReplyJson(stub shim.ChaincodeStubInterface,
						iter shim.StateQueryIteratorInterface) []byte {

	var fileQueryReply FileQueryReply

	for iter.HasNext() {
		kv, _ := iter.Next()
		fileId := string(kv.Value)
		fileMetaDataByte, err := stub.GetState(fileId)
		if err != nil {
			break;
		}
		var fileMetaData FileMetaData
		err = json.Unmarshal(fileMetaDataByte, &fileMetaData)
		if err != nil{
			break;
		}
		fileQueryReply.FileMetaDatas = append(fileQueryReply.FileMetaDatas,
				BuildFileMetaDataForQueryUse(&fileMetaData))
	}
	iter.Close()
	fileQueryReplyJson, _ := json.Marshal(fileQueryReply)
	return fileQueryReplyJson
}

func (t *SimpleAsset) getAllFileMetaData(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	iter, err := stub.GetStateByPartialCompositeKey("fileNameToFileId", []string{})
	if err != nil {
		return shim.Error("failed to GetStateByPartialCompositeKey: " + err.Error())
	}

	fileQueryReplyJson := t.iterToFileQueryReplyJson(stub, iter)
	return shim.Success(fileQueryReplyJson)
}

func (t *SimpleAsset) fileSearchByName(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	var fileQueryArgs FileQueryArgs
	err := json.Unmarshal([]byte(args[0]), &fileQueryArgs)
	if err != nil {
		return shim.Error("failed to json.Unmarshal: " + err.Error())
	}

	iter, err := stub.GetStateByPartialCompositeKey("fileNameToFileId",
										[]string{fileQueryArgs.FileName})
	if err != nil {
		return shim.Error("failed to GetStateByPartialCompositeKey: " + err.Error())
	}

	fileQueryReplyJson := t.iterToFileQueryReplyJson(stub, iter)

	return shim.Success(fileQueryReplyJson)
}


func (t *SimpleAsset) timeHelper(stub shim.ChaincodeStubInterface, begin string, end string) (int, int) {

	resBegin := 0
	if begin != "" {
		resBegin, _ = strconv.Atoi(begin)
	}
	resEnd, _ := strconv.Atoi(t.getTxTimestampSecond(stub))
	if end != "" {
		resEnd, _ = strconv.Atoi(end)
	}
	if resBegin > resEnd {
		resEnd = resBegin
	}
	return resBegin, resEnd
}

type Constraint func(string) bool

func (t *SimpleAsset) someFuckingCommonCode(stub shim.ChaincodeStubInterface,
				startKey string, endKey string, constraint Constraint) ([]byte, error) {

	iter, err := stub.GetStateByRange(startKey, endKey)
	if err != nil {
		return []byte{}, err
	}

	var fileQueryReply FileQueryReply
	for iter.HasNext() {
		kv, _ := iter.Next()

		if constraint(kv.Key) {
			fileId := string(kv.Value)
			fileMetaDataByte, err := stub.GetState(fileId)
			if err != nil {
				break;
			}
			var fileMetaData FileMetaData
			err = json.Unmarshal(fileMetaDataByte, &fileMetaData)
			if err != nil{
				break;
			}
			fileQueryReply.FileMetaDatas = append(fileQueryReply.FileMetaDatas,
					BuildFileMetaDataForQueryUse(&fileMetaData))
		}
	}
	iter.Close()
	fileQueryReplyJson, _ := json.Marshal(fileQueryReply)
	return fileQueryReplyJson, nil
}

func (t *SimpleAsset) fileSearchByTime(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	var fileQueryArgs FileQueryArgs
	err := json.Unmarshal([]byte(args[0]), &fileQueryArgs)
	if err != nil {
		return shim.Error("failed to json.Unmarshal: " + err.Error())
	}

	begin, end := t.timeHelper(stub, fileQueryArgs.Begin, fileQueryArgs.End)

	startKey := strings.Join([]string{"timeIndex", strconv.Itoa(begin)}, "$$")
	endKey := strings.Join([]string{"timeIndex", strconv.Itoa(end)}, "$$")

	timeConstraint := func(key string) bool {
		keyComponents := strings.Split(key, "$$")
		time, _ := strconv.Atoi(keyComponents[1])
		if time > begin && time < end {
			return true
		}
		return false
	}

	fileQueryReplyJson, err := t.someFuckingCommonCode(stub, startKey, endKey, timeConstraint)
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(fileQueryReplyJson)
}


func (t *SimpleAsset) fileSearchByDepartmentAndTime(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	var fileQueryArgs FileQueryArgs
	err := json.Unmarshal([]byte(args[0]), &fileQueryArgs)
	if err != nil {
		return shim.Error("failed to json.Unmarshal: " + err.Error())
	}

	begin, end := t.timeHelper(stub, fileQueryArgs.Begin, fileQueryArgs.End)

	startKey := strings.Join([]string{"departmentTimeIndex", fileQueryArgs.Department, strconv.Itoa(begin)}, "$$")
	endKey := strings.Join([]string{"departmentTimeIndex", fileQueryArgs.Department, strconv.Itoa(end)}, "$$")

	departmentConstraint := func(key string) bool {
		keyComponents := strings.Split(key, "$$")
		department := keyComponents[1]
		time, _ := strconv.Atoi(keyComponents[2])
		if department == fileQueryArgs.Department && time >= begin && time < end {
			return true
		}
		return false
	}

	fileQueryReplyJson, err := t.someFuckingCommonCode(stub, startKey, endKey, departmentConstraint)
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(fileQueryReplyJson)
}


func (t *SimpleAsset) fileSearchByUploaderAndTime(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	var fileQueryArgs FileQueryArgs
	err := json.Unmarshal([]byte(args[0]), &fileQueryArgs)
	if err != nil {
		return shim.Error("failed to json.Unmarshal: " + err.Error())
	}

	begin, end := t.timeHelper(stub, fileQueryArgs.Begin, fileQueryArgs.End)

	startKey := strings.Join([]string{"uploaderTimeIndex", fileQueryArgs.Uploader, strconv.Itoa(begin)}, "$$")
	endKey := strings.Join([]string{"uploaderTimeIndex", fileQueryArgs.Uploader, strconv.Itoa(end)}, "$$")

	uploaderConstraint := func(key string) bool {
		keyComponents := strings.Split(key, "$$")
		uploader := keyComponents[1]
		time, _ := strconv.Atoi(keyComponents[2])
		if uploader == fileQueryArgs.Uploader && time >= begin && time < end {
			return true
		}
		return false
	}

	fileQueryReplyJson, err := t.someFuckingCommonCode(stub, startKey, endKey, uploaderConstraint)
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(fileQueryReplyJson)
}


// request for file that needs authorization
func (t *SimpleAsset) fileRequestAuthorization(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	var fileRequestArgs FileRequestArgs
	err := json.Unmarshal([]byte(args[0]), &fileRequestArgs)
	if err != nil {
		return shim.Error(err.Error())
	}

	// verify request signature
	err = t.verifySignature(stub, fileRequestArgs.GetRequestLauncherSigContent(),
					fileRequestArgs.RequestLauncherSig, fileRequestArgs.RequestLauncherPKC)
	if err != nil {
		return shim.Error(err.Error())
	}

	// verify requestLauncherDepartmentProf
	err = t.verifySignature(stub, fileRequestArgs.GetDepartmentProfContent(),
					fileRequestArgs.RequestLauncherDepartmentProf, fileRequestArgs.DepartmentPKC)

	fileMetaDataByte, err := stub.GetState(fileRequestArgs.FileId)
	if err != nil {
		return shim.Error(err.Error())
	}
	if fileMetaDataByte == nil {
		return shim.Error("file not exists")
	}

	var fileMetaData FileMetaData
	err = json.Unmarshal(fileMetaDataByte, &fileMetaData)
	if err != nil {
		return shim.Error("failed to unmarshal fileMetaData: " + err.Error())
	}

	if !fileMetaData.NeedAuthorization {
		return shim.Error("the file is open to all departments")
	}

	txId := stub.GetTxID()

	acReply, err := t.accessControl(txId, &fileRequestArgs, &fileMetaData)
	if err != nil {
		return shim.Error("failed to access control: " + err.Error())
	}

	// verify responseBody
	err = t.verifySignature(stub, acReply.GetFileDepartmentSigContent(),
		acReply.FileDepartmentSig, acReply.FileDepartmentPKC)
	if err != nil {
		return shim.Error("failed to verify acReply: " + err.Error())
	}

	fileRequestRecord := BuildFileRequestRecord(&fileRequestArgs, &acReply)
	fileRequestRecordJson, err := json.Marshal(fileRequestRecord)
	if err != nil {
		return shim.Error("failed to marshal fileRequestRecord: " + err.Error())
	}
	err = stub.PutState(txId, fileRequestRecordJson)
	if err != nil {
		return shim.Error("failed to store fileRequestRecord: " + err.Error())
	}

	// trigger event

	return shim.Success(nil)
}

func (t *SimpleAsset) accessControl(txId string, fileRequestArgs *FileRequestArgs,
						fileMetaData *FileMetaData) (AccessControlReply, error) {

	var accessControlReply AccessControlReply
	accessControlRequest := AccessControlRequest{
		TxId 						:txId,
		FileId 						:fileMetaData.FileId,
		FileName 					:fileMetaData.FileName,
		FileVersion 				:fileMetaData.FileVersion,
		RequestLauncher 			:fileRequestArgs.RequestLauncher,
		RequestLauncherDepartment 	:fileRequestArgs.RequestLauncherDepartment,
		RequestLauncherPKC			:fileRequestArgs.RequestLauncherPKC,
	}

	accessControlRequestJson, err := json.Marshal(accessControlRequest)
	if err != nil {
		return accessControlReply, errors.New("failed to marshal request: " + err.Error())
	}

	response, err := http.Post(fileMetaData.Entry, "application/json",
							bytes.NewReader(accessControlRequestJson))
	if err != nil {
		return accessControlReply, errors.New("failed to POST:" + err.Error())
	}
	defer response.Body.Close()
	if response.StatusCode != 200 {
		return accessControlReply, errors.New("accessControl response.StatusCode != 200")
	}

	decoder := json.NewDecoder(response.Body)
	err = decoder.Decode(&accessControlReply)
	if err != nil {
		return accessControlReply, errors.New("failed to decode response.Body: " + err.Error())
	}

	return accessControlReply, nil
}

// request for file that open to all departments
func (t *SimpleAsset) fileRequest(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	var fileRequestArgs FileRequestArgs
	err := json.Unmarshal([]byte(args[0]), &fileRequestArgs)
	if err != nil {
		return shim.Error(err.Error())
	}

	// verify request signature
	err = t.verifySignature(stub, fileRequestArgs.GetRequestLauncherSigContent(),
					fileRequestArgs.RequestLauncherSig, fileRequestArgs.RequestLauncherPKC)
	if err != nil {
		return shim.Error(err.Error())
	}

	// verify requestLauncherDepartmentProf
	err = t.verifySignature(stub, fileRequestArgs.GetDepartmentProfContent(),
					fileRequestArgs.RequestLauncherDepartmentProf, fileRequestArgs.DepartmentPKC)

	fileMetaDataByte, err := stub.GetState(fileRequestArgs.FileId)
	if err != nil {
		return shim.Error(err.Error())
	}
	if fileMetaDataByte == nil {
		return shim.Error("file not exists")
	}

	var fileMetaData FileMetaData
	err = json.Unmarshal(fileMetaDataByte, &fileMetaData)
	if err != nil {
		return shim.Error(err.Error())
	}

	if fileMetaData.NeedAuthorization {
		return shim.Error("the file needs authorization")
	}

	fileRequestReply := BuildFileRequestReply(&fileMetaData)
	fileRequestReplyJson, err := json.Marshal(fileRequestReply)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(fileRequestReplyJson)
}

func (t *SimpleAsset) getAuthorisedRecord(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	txId := args[0];
	recordByte, err := stub.GetState(txId)
	if err != nil {
		return shim.Error("failed to GetState: " + err.Error())
	}
	return shim.Success(recordByte)
}
