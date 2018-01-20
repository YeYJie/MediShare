package main

import "os"
import "crypto"
import "crypto/rsa"
import "crypto/x509"
import "crypto/rand"
import "crypto/sha256"
import "encoding/pem"
import "io/ioutil"
import "fmt"
import "errors"
import "encoding/hex"

func mysign(hash [32]byte, privateKey *rsa.PrivateKey) (s []byte, err error) {

	s, err = rsa.SignPKCS1v15(rand.Reader, privateKey, crypto.SHA256, hash[:])
	return  s, nil
}

func ParseRsaPrivateKeyFromPemStr(privPEM string) (*rsa.PrivateKey, error) {
    block, _ := pem.Decode([]byte(privPEM))
    if block == nil {
            return nil, errors.New("failed to parse PEM block containing the key")
    }

    priv, err := x509.ParsePKCS1PrivateKey(block.Bytes)
    if err != nil {
            return nil, err
    }

    return priv, nil
}

func myver(sig string) {
	fmt.Println("----")
	fmt.Println(sig)
	fmt.Println("----")
	signature, _ := hex.DecodeString(sig)
	fmt.Println(signature)
}

func main() {
	// doctor := flag.String("doctor", "", "doctor name")
	// patient := flag.String("patient", "", "patient name")
	// n := flag.String("reqN", "", "reqN")
	// privateKeyFile := flag.String("privateKey", "privatekey", "privateKey file name")

	args := os.Args[1:]
	privateKeyFile := args[0]
	msg := ""
	for index, content := range args[1:] {
		if index != 0 {
			msg += "$$"
		}
		msg += content
	}

	fmt.Println(msg)

	fileContent, _ := ioutil.ReadFile(privateKeyFile)
	privateKeyString := string(fileContent)
	privateKey, _ := ParseRsaPrivateKeyFromPemStr(privateKeyString)

	// msg := []byte(*doctor + "$$" + *patient + "$$" + *n)

	hash := sha256.Sum256([]byte(msg))
	sig, _ := mysign(hash, privateKey)

	fmt.Println(sig)

	myver(hex.EncodeToString(sig))
}
