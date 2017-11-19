package main

import (
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)


type SimpleAsset struct {
}

func main() {
	if err := shim.Start(new(SimpleAsset)); err != nil {
		fmt.Printf("Error starting SimpleAsset chaincode: %s", err)
	}
}


func (t *SimpleAsset) Init(stub shim.ChaincodeStubInterface) peer.Response {
	return shim.Success(nil)
}

func (t *SimpleAsset) debugImpl(str string) {
	fmt.Printf("%s\n", str)
}

func (t *SimpleAsset) debug(format string, a ...interface{}) {
	t.debugImpl(fmt.Sprintf(format, a...))
}

func (t *SimpleAsset) echo(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	return shim.Success([]byte(args[0]))
}

func (t *SimpleAsset) delSellerFormat(stub shim.ChaincodeStubInterface, seller string) bool {

	iter, err := stub.GetStateByPartialCompositeKey(seller, []string{})
	if err != nil {
		return false
	}
	for iter.HasNext() {
		kv, err := iter.Next()
		err = stub.DelState(string(kv.Key))
		if err == nil {
			t.debug("delSellerFormat del %v -> %v", kv.Key, kv.Value)
		}
	}
	return true
}

func (t *SimpleAsset) setFormatAboutSeller(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args:
	//	0		  	1
	// "seller", "formatData"

	if len(args) < 2 {
		return shim.Error("setFormatAboutSeller Incorrect number of arguments")
	}
	t.delSellerFormat(stub, args[0])

	key, err := stub.CreateCompositeKey(args[0], []string{})
	if err != nil {
		return shim.Error(err.Error())
	}
	valueByte := []byte(args[1])
	err = stub.PutState(key, valueByte)
	if err != nil {
		return shim.Error(err.Error())
	}
	t.debug("setFormatAboutSeller %v -> %v", key, args[1])
	return shim.Success(nil)
}

func (t *SimpleAsset) getFormatAboutSeller(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	// 0
	// "seller"

	if len(args) < 1 {
		return shim.Error("getFormatAboutSeller Incorrect number of arguments")
	}
	iter, err := stub.GetStateByPartialCompositeKey(args[0], []string{})
	if err != nil {
		return shim.Error(err.Error())
	}
	res := ""
	for iter.HasNext() {
		kv, _ := iter.Next()
		res += string(kv.Key) + ": " + string(kv.Value) + "\n"
	}
	t.debug("getFormatAboutSeller %v -> %v", args[0], res)
	return shim.Success([]byte(res))
}

func (t *SimpleAsset) delFormatAboutSeller(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	// 0
	// "seller"
	if len(args) < 1 {
		return shim.Error("delFormatAboutSeller Incorrect number of arguments")
	}

	iter, err := stub.GetStateByPartialCompositeKey(args[0], []string{})
	if err != nil {
		return shim.Error(err.Error())
	}
	for iter.HasNext() {
		kv, err := iter.Next()
		err = stub.DelState(string(kv.Key))
		if err != nil {
			return shim.Error(err.Error())
		} else {
			t.debug("delFormatAboutSeller del %v -> %v", kv.Key, kv.Value)
		}
	}

	return shim.Success(nil)
}

func (t *SimpleAsset) setFormatAboutData(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	//	0		  	1			2
	// "seller", "dataName", "formatData"

	if len(args) < 3 {
		return shim.Error("setFormatAboutData Incorrect number of arguments")
	}

	key, err := stub.CreateCompositeKey(args[0], []string{args[1]})
	if err != nil {
		return shim.Error(err.Error())
	}
	valueByte := []byte(args[2])
	err = stub.PutState(key, valueByte)
	if err != nil {
		return shim.Error(err.Error())
	}
	t.debug("setFormatAboutData %v -> %v", key, args[1])
	return shim.Success(nil)
}

func (t *SimpleAsset) getFormatAboutData(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	// 0			1
	// "seller", "dataName"

	if len(args) < 2 {
		return shim.Error("getFormatAboutData Incorrect number of arguments")
	}
	iter, err := stub.GetStateByPartialCompositeKey(args[0], []string{args[1]})
	if err != nil {
		return shim.Error(err.Error())
	}
	res := ""
	for iter.HasNext() {
		kv, _ := iter.Next()
		res += string(kv.Key) + ": " + string(kv.Value) + "\n"
	}
	t.debug("getFormatAboutData %v -> %v", args[0], res)
	return shim.Success([]byte(res))
}

func (t *SimpleAsset) delFormatAboutData(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	// 0			1
	// "seller", "dataName"

	if len(args) < 2 {
		return shim.Error("delFormatAboutData Incorrect number of arguments")
	}
	key, err := stub.CreateCompositeKey(args[0], []string{args[1]})
	if err != nil {
		return shim.Error(err.Error())
	}
	err = stub.DelState(key)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(nil)
}

func byteArrayToInt(arr []byte) int {
	ret, _ := strconv.Atoi(string(arr))
	return ret
}

func intToByteArray(num int) []byte {
	return []byte(strconv.Itoa(num))
}

func (t *SimpleAsset) triggerEvent(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	// 0				1
	// eventName 	payload

	if len(args) < 2 {
		return shim.Error("trigger Incorrect number of arguments")
	}
	name := args[0]
	payload := []byte(args[1])
	err := stub.SetEvent(name, payload)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(nil)
}

func (t *SimpleAsset) doSetBalance(stub shim.ChaincodeStubInterface, me string, balance int) error {
	key, err := stub.CreateCompositeKey("balance", []string{me})
	if err != nil {
		return err
	}
	err = stub.PutState(key, intToByteArray(balance))
	if err != nil {
		return err
	}
	return nil
}

func (t *SimpleAsset) sb(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	// 0			1
	// me 		balance

	if len(args) < 2 {
		return shim.Error("sb Incorrect number of arguments")
	}
	me := args[0]
	balance, err := strconv.Atoi(args[1])
	err = t.doSetBalance(stub, me, balance)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success([]byte(fmt.Sprintf("sb %v -> %v", me, balance)))
}

func (t *SimpleAsset) doGetBalance(stub shim.ChaincodeStubInterface, me string) (int, error) {

	res := 0
	iter, err := stub.GetStateByPartialCompositeKey("balance", []string{me})
	if err != nil {
		return res, err
	}
	for iter.HasNext() {
		kv, _ := iter.Next()
		res += byteArrayToInt(kv.Value)
	}
	return res, nil
}

func (t *SimpleAsset) getBalance(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	// 0
	// me

	if len(args) < 1 {
		return shim.Error("getBalance Incorrect number of arguments")
	}
	res, err := t.doGetBalance(stub, args[0])
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(intToByteArray(res))
}

var RequestID = 1

func (t *SimpleAsset) requestData(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	// 0		1		2			3		4
	// "me", "seller", "dataName", "price", "msg"

	if len(args) < 5 {
		return shim.Error("requestData Incorrect number of arguments")
	}
	me := args[0]
	seller := args[1]
	dataName := args[2]
	priceString := args[3]
	priceInt, err := strconv.Atoi(priceString)
	if err != nil {
		return shim.Error("requestData Error Price")
	}
	msg := args[4]

	myBalanceInt, err := t.doGetBalance(stub, me)
	if err != nil {
		return shim.Error("requestData getBalance failed")
	}
	if myBalanceInt < priceInt {
		return shim.Error("requestData not enough money")
	}

	err = t.doSetBalance(stub, me, myBalanceInt - priceInt)
	if err != nil {
		return shim.Error("requestData setBalance failed")
	}

	key, err := stub.CreateCompositeKey("request", []string{
					"$$", seller,
					"$$", strconv.Itoa(RequestID),
					"$$", me,
					"$$", dataName,
					"$$", priceString,
		})
	if err != nil {
		return shim.Error(err.Error())
	}
	RequestID++
	err = stub.PutState(key, []byte(msg))
	if err != nil {
		return shim.Error(err.Error())
	}
	t.debug("requestData %v -> %v", key, msg)
	return shim.Success(nil)
}

func (t *SimpleAsset) parseRequestKey(stub shim.ChaincodeStubInterface, k string) (reqID, buyer, dataName, price string) {

	objtype, s, err := stub.SplitCompositeKey(k)
	t.debug("parseRequestKey %v %v", objtype, s)
	if err != nil || objtype != "request" || len(s) != 10 {
		reqID = ""
		buyer = ""
		dataName = ""
		price = "0"
		return		
	}
	reqID = s[3]
	buyer = s[5]
	dataName = s[7]
	price = s[9]
	return
}

func (t *SimpleAsset) getRequest(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	// 0
	// me

	if len(args) < 1 {
		return shim.Error("getRequest Incorrect number of arguments")
	}

	me := args[0]
	iter, err := stub.GetStateByPartialCompositeKey("request", []string{"$$", me})
	if err != nil {
		return shim.Error(err.Error())
	}
	res := ""
	for iter.HasNext() {
		kv, _ := iter.Next()
		reqID, buyer, dataName, price := t.parseRequestKey(stub, kv.Key)
		res += "\nRequestID : " + reqID
		res += "\n\tbuyer : " + buyer
		res += "\n\tdataName : " + dataName
		res += "\n\tprice : " + price
		res += "\n\tmsg : " + string(kv.Value)
		res += "\n"
	}
	// t.debug("getRequest %v", res)
	return shim.Success([]byte(res))
}

func (t *SimpleAsset) grantRequest(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// args
	// 0			1		2		3		4
	// "seller", "buyer", "reqID", "msg", "digest"

	if len(args) < 5 {
		return shim.Error("grantRequest Incorrect number of arguments")
	}

	seller := args[0]
	buyer := args[1]
	reqIDString := args[2]

	//
	//	get the request
	//
	iter, err := stub.GetStateByPartialCompositeKey("request", []string{
			"$$", seller,
			"$$", reqIDString,
			"$$", buyer,
		})
	if err != nil {
		return shim.Error(err.Error())
	}
	priceInt := 0
	for iter.HasNext() { // runs only one time
		kv, err := iter.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		_, _, _, priceString := t.parseRequestKey(stub, kv.Key)
		priceInt, _ = strconv.Atoi(priceString)
	}
	iter.Close()

	//
	//	update balance
	//
	myBalanceInt, err := t.doGetBalance(stub, seller)
	if err != nil {
		return shim.Error("grantRequest getBalance failed" + err.Error())
	}

	err = t.doSetBalance(stub, seller, myBalanceInt + priceInt)
	if err != nil {
		return shim.Error("grantRequest setBalance failed" + err.Error())
	}

	//
	//	grant the request
	//
	key, err := stub.CreateCompositeKey("grant", []string{
						"$$", seller,
						"$$", reqIDString,
						"$$", buyer,
		})
	if err != nil {
		return shim.Error("grantRequest CreateCompositeKey failed" + err.Error())
	}

	err = stub.PutState(key, []byte(args[3] + " $$ " + args[4]))
	if err != nil {
		return shim.Error(err.Error())
	}

	//
	// delete the request
	// 
	iter, err = stub.GetStateByPartialCompositeKey("request", []string{
			"$$", seller,
			"$$", reqIDString,
			"$$", buyer,
		})
	if err != nil {
		return shim.Error(err.Error())
	}
	for iter.HasNext() { // runs only one time
		kv, err := iter.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		err = stub.DelState(kv.Key)
		if err != nil {
			return shim.Error(err.Error())
		}
	}
	iter.Close()

	t.debug("grantRequest %v", args)
	return shim.Success(nil)
}

func (t *SimpleAsset) printAll(stub shim.ChaincodeStubInterface) peer.Response {
	t.debug("\n====printAll====\n")
	iter, _ := stub.GetStateByRange("", "")
	for iter.HasNext() {
		kv, _ := iter.Next()
		t.debug("%v -> %v", kv.Key, string(kv.Value))
	}
	iter, _ = stub.GetStateByPartialCompositeKey("balance", []string{})
	for iter.HasNext() {
		kv, _ := iter.Next()
		t.debug("%v -> %v", kv.Key, string(kv.Value))
	}
	iter, _ = stub.GetStateByPartialCompositeKey("request", []string{})
	for iter.HasNext() {
		kv, _ := iter.Next()
		t.debug("%v -> %v", kv.Key, string(kv.Value))
	}
	iter, _ = stub.GetStateByPartialCompositeKey("grant", []string{})
	for iter.HasNext() {
		kv, _ := iter.Next()
		t.debug("%v -> %v", kv.Key, string(kv.Value))
	}
	t.debug("========\n")
	return shim.Success(nil)
}

func (t *SimpleAsset) Invoke(stub shim.ChaincodeStubInterface) peer.Response {

	function, args := stub.GetFunctionAndParameters()
	fmt.Println("invoke is running " + function)


	if function == "setFormatAboutSeller" {
		return t.setFormatAboutSeller(stub, args)
	} else if function == "getFormatAboutSeller" {
		return t.getFormatAboutSeller(stub, args)
	} else if function == "delFormatAboutSeller" {
		return t.delFormatAboutSeller(stub, args)
	} else if function == "setFormatAboutData" {
		return t.setFormatAboutData(stub, args)
	} else if function == "getFormatAboutData" {
		return t.getFormatAboutData(stub, args)
	} else if function == "delFormatAboutData" {
		return t.delFormatAboutData(stub, args)
	} else if function == "getBalance" {
		return t.getBalance(stub, args)
	} else if function == "requestData" {
		return t.requestData(stub, args)
	} else if function == "getRequest" {
		return t.getRequest(stub, args)
	} else if function == "grantRequest" {
		return t.grantRequest(stub, args)
	} else if function == "sb" {
		// for debug use, setBalance
		return t.sb(stub, args)
	} else if function == "all" {
		// for debug use, print all states
		return t.printAll(stub)
	} else if function == "setevent" {
		// for debug use, trigger event
		return t.triggerEvent(stub, args)
	} else if function == "echo" {
		// for debug use, echo
		return t.echo(stub, args)
	}

	fmt.Println("invoke did not find func: " + function) //error
	return shim.Error("Received unknown function invocation")
}
