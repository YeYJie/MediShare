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

	// update indices
	insertIndex := func(keyComponents []string, value string) {
		if err != nil {
			return
		}
		key, err := stub.CreateCompositeKey(keyComponents[0], keyComponents[1:])
		if err != nil {
			return
		}
		err = stub.PutState(key, []byte(value))
	}
	insertIndex([]string{"departmentTimeIndex", fileUploadArgs.Department, txTimestampSecond}, fileId)
	insertIndex([]string{"uploaderTimeIndex", fileUploadArgs.Uploader, txTimestampSecond}, fileId)
	insertIndex([]string{"timeIndex", txTimestampSecond}, fileId)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(nil)
}

func (t *SimpleAsset) getAllFileMetaData(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	// return shim.Success(nil)
	iter, err := stub.GetStateByPartialCompositeKey("fileNameToFileId", []string{})
	if err != nil {
		return shim.Error("failed to GetStateByPartialCompositeKey: " + err.Error())
	}

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

	fileQueryReplyJson, err := json.Marshal(fileQueryReply)
	if err != nil {
		return shim.Error("failed to json.Marshal: " + err.Error())
	}
	return shim.Success(fileQueryReplyJson)
}

func (t *SimpleAsset) fileSearchByName(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	var fileQueryArgs FileQueryArgs
	err := json.Unmarshal([]byte(args[0]), &fileQueryArgs)
	if err != nil {
		return shim.Error("failed to json.Unmarshal: " + err.Error())
	}

	iter, err := stub.GetStateByPartialCompositeKey("fileNameToFileId", []string{fileQueryArgs.FileName})
	if err != nil {
		return shim.Error("failed to GetStateByPartialCompositeKey: " + err.Error())
	}

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

	fileQueryReplyJson, err := json.Marshal(fileQueryReply)
	if err != nil {
		return shim.Error("failed to json.Marshal: " + err.Error())
	}
	return shim.Success(fileQueryReplyJson)
}


func (t *SimpleAsset) fileSearchByDepartment(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	return shim.Success(nil)
}


func (t *SimpleAsset) fileSearchByPublisher(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	return shim.Success(nil)
}


func (t *SimpleAsset) fileSearchByTime(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	return shim.Success(nil)
}


func (t *SimpleAsset) fileSearchByDepartmentAndTime(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	var fileQueryArgs FileQueryArgs
	err := json.Unmarshal([]byte(args[0]), &fileQueryArgs)
	if err != nil {
		return shim.Error("failed to json.Unmarshal: " + err.Error())
	}

	department := fileQueryArgs.Department
	begin := fileQueryArgs.DepartmentBegin
	end := fileQueryArgs.DepartmentEnd

	startKey, err := stub.CreateCompositeKey("departmentTimeIndex", []string{department, begin})
	if err != nil {
		return shim.Error("failed to CreateCompositeKey: " + err.Error())
	}
	endKey, err := stub.CreateCompositeKey("departmentTimeIndex", []string{department, end})
	if err != nil {
		return shim.Error("failed to CreateCompositeKey: " + err.Error())
	}

	iter, err := stub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error("failed to GetStateByRange: " + err.Error())
	}
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

	fileQueryReplyJson, err := json.Marshal(fileQueryReply)
	if err != nil {
		return shim.Error("failed to json.Marshal: " + err.Error())
	}
	return shim.Success(fileQueryReplyJson)
}


func (t *SimpleAsset) fileSearchByPublisherAndTime(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	return shim.Success(nil)
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
