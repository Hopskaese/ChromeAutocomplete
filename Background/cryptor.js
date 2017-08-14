/// <reference path="../Include/aes.ts"/>
//https://jsperf.com/crypto-js-pbkdf2-sha512
//https://stackoverflow.com/questions/20519166/cant-decrypt-string-with-cryptojs
var Cryptor = (function () {
    function Cryptor() {
        this.m_KeySize = 256;
        this.m_IvSize = 128;
        this.m_Iterations = 100;
    }
    Cryptor.prototype.Encrypt = function (username, password) {
        var pass = "test";
        var salt = CryptoJS.lib.WordArray.random(128 / 8);
        var key = CryptoJS.PBKDF2(pass, salt, {
            keySize: this.m_KeySize / 32,
            iterations: this.m_Iterations
        });
        var iv = CryptoJS.lib.WordArray.random(128 / 8);
        // remember to call encrypted.toString() before savin in database because otherwise its object
        var encrypted = CryptoJS.AES.encrypt(username, key, {
            iv: iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });
        console.log("Encrypted username:" + encrypted);
        //decrypt
        var decrypt = CryptoJS.AES.decrypt(encrypted, key, {
            iv: iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });
        console.log("Decrypted:" + decrypt.toString(CryptoJS.enc.Utf8));
    };
    return Cryptor;
}());
