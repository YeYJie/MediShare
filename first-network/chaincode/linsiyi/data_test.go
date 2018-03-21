package main

import (
	"fmt"
	"testing"
	"io"
	// "io/ioutil"
	// "encoding/pem"
	"encoding/json"
	"time"
	"strconv"
	"net/http"
	"github.com/hyperledger/fabric/core/chaincode/shim"
)

func checkInit(t *testing.T, stub *shim.MockStub, args [][]byte) {
	res := stub.MockInit("1", args)
	if res.Status != shim.OK {
		fmt.Println("Init failed", string(res.Message))
		t.FailNow()
	}
}

func checkState(t *testing.T, stub *shim.MockStub, name string, value string) {
	bytes := stub.State[name]
	if bytes == nil {
		fmt.Println("State", name, "failed to get value")
		t.FailNow()
	}
	if string(bytes) != value {
		fmt.Println("State value", name, "was not", value, "as expected")
		t.FailNow()
	}
}

func checkKeyValue(t *testing.T, stub *shim.MockStub) {
	for k, v := range stub.State {
		fmt.Println(k + "  ->  " + string(v))
	}
}

func checkInvoke(t *testing.T, stub *shim.MockStub, args [][]byte) string {
	res := stub.MockInvoke("1", args)
	if res.Status != shim.OK {
		fmt.Println("Invoke", args, "failed", string(res.Message))
		t.FailNow()
	}
	return string(res.Payload)
}


const departmentPKC = `-----BEGIN CERTIFICATE-----
MIIDXjCCAkagAwIBAgIQBfnZ1i8mY6jJfN2Q+FZWWzANBgkqhkiG9w0BAQsFADAU
MRIwEAYDVQQDDAl5ZXlvbmdqaWUwHhcNMTgwMzEzMDQxMzUyWhcNMjgwMzEwMDQx
MzUyWjAUMRIwEAYDVQQDDAlsb2NhbGhvc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IB
DwAwggEKAoIBAQCaYV6VKje0ZEoDB9m0EdIF4rPhs+psx2Nh/S7sa6HSOIQ6wSIz
aYSLirTp3Mem58AvllWTAl+c8UUciWQZ04SCAUqn9JEuhQh/+xHF6TtEoE7kWhsM
tDEzgWx1KlwayYrAPJeBv2UQzhaiLkW/BW/R3Hnb89fvBLMlcZ3CPwQEpcTU/e6o
iubBt/HXiL49usl6HZQatDjgpXWB+MvH/AJEw65X3u3nEj8lUEsHWZBpTFnpe+97
+QkypWG39JEhDF8muas1WGUdJKPqvoMytpM9eB//NuybelnXnLZzpAs/eEDgQPpj
MB9n07Im4Yoe+vvkNeyn3yRo08PE96rMo+MpAgMBAAGjgaswgagwCQYDVR0TBAIw
ADAdBgNVHQ4EFgQUkfkHykFMFBofyrMtrR9Ln8lMEIgwRAYDVR0jBD0wO4AUSwBC
Qsu8xFai8SbhbYTK7SK4yaehGKQWMBQxEjAQBgNVBAMMCXlleW9uZ2ppZYIJAIF4
B1QIfJuOMBMGA1UdJQQMMAoGCCsGAQUFBwMBMAsGA1UdDwQEAwIFoDAUBgNVHREE
DTALgglsb2NhbGhvc3QwDQYJKoZIhvcNAQELBQADggEBAKI5xNLmGaJmp12itE0v
VZsjth5vYBGv4FXnd5Hz3ijJpzQ7+npdmL51NW1lq/hxOK4Ft4JsglvanM0/llHZ
hIjGYZ8KeIxXWKVYl6E/gvlyETrK9CC1s/yIbWMiGfMWsvzk97hhOo2FlgfOEFtn
qZcKnSwTWvF/7YE92AL9X+F40bPuLgoewb/gRxsa1kgiBxpiz9t9onZ73KV0hyRZ
U1ld3W2b+SARoqNVYLl0Cd0/5O9wCa6cWMGmLWejGp8dWWTxdVKB49nPk3Rlx3nl
b9+LCI7kgk3AoHOgf93iKYuMPr73ei35bEOtHGe2awHZLRNKVvC+ioLIo6AS7hpr
A9E=
-----END CERTIFICATE-----`


func convertToBytesArray(arr []string) [][]byte {

	var res [][]byte
	for _, i := range arr {
		res = append(res, []byte(i))
	}
	return res
}

func TestVerifySignature(t *testing.T) {
	fmt.Println("testing verifySignature...\n")
	scc := new(SimpleAsset)
	stub := shim.NewMockStub("linsiyi", scc)
	checkInit(t, stub, nil)

	departmentContent := "yeyongjie\n"
	departmentSig := "8ec00b477a1da8b0de20b27b82fd64b78ccc7398a652dd64ab5dbebdfcb4a3bb8cbbc66df3578fd2ec16325234ddae471c596e63cdbbfb328880dc229abafe4527d869dfb6ba9aa3d91469d8c4b43914bc6cd45e5e18cb231ee18de0181fd53ce4243be65112808a256a2ef9816d6238df6eaf42e439181b66c7f3d531b32d83b5ff967971c7a4aa6f06d874c5a6aa4e2eb4b0e4c9c90d69007ad9320fdf0e66b7187d8b07527945e4a0b27f6dd3dae9d22a846af65b180267a3699ab3aa248739f8d0e81d6edb96c7a16b42348fa115af2ed3a7621013f81f2dbfa5158bb7b3af11b29c478b65123ecebf3701d6aef04c01500a18a6b78a09b1dc4e46a6b14e"

	err := scc.verifySignature(stub, departmentContent, departmentSig, departmentPKC)
	if err != nil {
		fmt.Println(err.Error())
		t.FailNow()
	}

	// checkKeyValue(t, stub)
}

func TestNewFileId(t *testing.T) {
	fmt.Println("testing newFileId...\n")

	scc := new(SimpleAsset)
	stub := shim.NewMockStub("linsiyi", scc)
	checkInit(t, stub, nil)

	checkInvoke(t, stub, convertToBytesArray([]string{"newFileId", "yeyongjie"}))
	key, _ := stub.CreateCompositeKey("yeyongjie", []string{"v1.0"})
	checkState(t, stub, key, "yeyongjiev1.0")

	checkInvoke(t, stub, convertToBytesArray([]string{"newFileId", "zhongshandaxue"}))
	key, _ = stub.CreateCompositeKey("zhongshandaxue", []string{"v1.0"})
	checkState(t, stub, key, "zhongshandaxuev1.0")

	checkInvoke(t, stub, convertToBytesArray([]string{"newFileId", "yeyongjie"}))
	key, _ = stub.CreateCompositeKey("yeyongjie", []string{"v2.0"})
	checkState(t, stub, key, "yeyongjiev2.0")

	// checkKeyValue(t, stub)
}



const testURL = "/test/yeyongjie"

func uploadFile(t *testing.T, stub *shim.MockStub) {

	fileUploadArgs := FileUploadArgs{
		UploadType		: "upload",
		FileName		: "fileForUpload",
		FileSize		: "uploadSize",
		FileChecksum	: "checksumForUpload",
		Uploader		: "uploader",
		UploadTime 		: strconv.FormatInt(time.Now().Unix(), 10),
		UploaderSig		: "uploaderSig",
		UploaderPKC		: "uploaderPKC",
		Entry			: "http://127.0.0.1:8080" + testURL,
		EntryFormat		: "acEntryFormat",
		Department		: "department",
		DepartmentSig	: "departmentSig",
		DepartmentPKC	: "departmentPKC",
	}
	args, _ := json.Marshal(fileUploadArgs)
	checkInvoke(t, stub, [][]byte{[]byte("fileUpload"), args})
}

func TestUpload(t *testing.T) {
	fmt.Println("testing file upload...\n")

	scc := new(SimpleAsset)
	stub := shim.NewMockStub("linsiyi", scc)
	checkInit(t, stub, nil)

	uploadFile(t, stub)
	// checkKeyValue(t, stub)
}


func publishFile(t *testing.T, stub *shim.MockStub) {

	fileUploadArgs := FileUploadArgs{
		UploadType		: "publish",
		FileName		: "fileForPublish",
		FileSize		: "publishSize",
		FileChecksum	: "checksumForPublish",
		Uploader		: "publisher",
		UploadTime 		: strconv.FormatInt(time.Now().Unix(), 10),
		UploaderSig		: "publisherSig",
		UploaderPKC		: "publisherPKC",
		Entry			: "fileEntry",
		EntryFormat		: "fileEntryFormat",
		Department		: "department",
		DepartmentSig	: "departmentSig",
		DepartmentPKC	: "departmentPKC",
	}
	args, _ := json.Marshal(fileUploadArgs)
	checkInvoke(t, stub, [][]byte{[]byte("fileUpload"), args})
}

func TestFilePublish(t *testing.T) {
	fmt.Println("testing file publish...\n")

	scc := new(SimpleAsset)
	stub := shim.NewMockStub("linsiyi", scc)
	checkInit(t, stub, nil)

	publishFile(t, stub)
	// checkKeyValue(t, stub)
}


func TestFileRequest(t *testing.T) {
	fmt.Println("testing request file")

	scc := new(SimpleAsset)
	stub := shim.NewMockStub("linsiyi", scc)
	checkInit(t, stub, nil)

	publishFile(t, stub)

	fileRequestArgs := FileRequestArgs{
		FileId							: "fileForPublishv1.0",
		RequestLauncher					: "requestLauncher",
		RequestLauncherDepartment		: "requestLauncherDepartment",
		RequestLauncherDepartmentProf	: "requestLauncherDepartmentProf",
		DepartmentPKC					: "departmentPKC",
		RequestTime						: strconv.FormatInt(time.Now().Unix(), 10),
		RequestLauncherSig				: "requestLauncherSig",
		RequestLauncherPKC				: "requestLauncherPKC",
	}
	args, _ := json.Marshal(fileRequestArgs)
	res := checkInvoke(t, stub, [][]byte{[]byte("fileRequest"), args})
	fmt.Println(res)
}


func TestFileRequestAuthorization(t *testing.T) {
	fmt.Println("testing request file authorization...\n")

	scc := new(SimpleAsset)
	stub := shim.NewMockStub("linsiyi", scc)
	checkInit(t, stub, nil)

	uploadFile(t, stub)

	// run the REST server
	restServer := &http.Server{Addr: ":8080"}
	http.HandleFunc(testURL, func(w http.ResponseWriter, r *http.Request) {
		// fmt.Println(r.URL.String())
		// fmt.Fprintf(w, "accessControlModuleSignature")

		decoder := json.NewDecoder(r.Body)
		var accessControlRequest AccessControlRequest
		err := decoder.Decode(&accessControlRequest)
		if err != nil {
			fmt.Println("REST server error: " + err.Error())
		    panic(err)
		}
		defer r.Body.Close()
		// fmt.Printf("REST server accessControlRequest: %+v\n", accessControlRequest)

		accessControlReply := AccessControlReply{
			TxId 						: accessControlRequest.TxId,
			FileId 						: accessControlRequest.FileId,
			Success 					: true,
			RequestLauncher 			: accessControlRequest.RequestLauncher,
			RequestLauncherDepartment 	: accessControlRequest.RequestLauncherDepartment,
			FileEntry 					: "REST FileEntry",
			FileEntryFormat 			: "REST FileEntryFormat",
			CacheControl 				: "REST CacheControl",
			FileDepartmentSig 			: "FileDepartmentSig",
			FileDepartmentPKC			: "FileDepartmentPKC",
		}
		accessControlReplyJson, err := json.Marshal(accessControlReply)
		if err != nil {
			fmt.Println("REST server error: " + err.Error())
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		io.WriteString(w, string(accessControlReplyJson))

		// fmt.Println("REST server return: " + string(accessControlReplyJson))
	})
	defer restServer.Shutdown(nil)

	go restServer.ListenAndServe()

	fileRequestArgs := FileRequestArgs{
		FileId							: "fileForUploadv1.0",
		RequestLauncher					: "requestLauncher",
		RequestLauncherDepartment		: "requestLauncherDepartment",
		RequestLauncherDepartmentProf	: "requestLauncherDepartmentProf",
		DepartmentPKC					: "departmentPKC",
		RequestTime						: strconv.FormatInt(time.Now().Unix(), 10),
		RequestLauncherSig				: "requestLauncherSig",
		RequestLauncherPKC				: "requestLauncherPKC",
	}
	args, _ := json.Marshal(fileRequestArgs)
	checkInvoke(t, stub, [][]byte{[]byte("fileRequestAuthorization"), args})

	// checkKeyValue(t, stub)
}
