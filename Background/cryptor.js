/// <reference path="../Include/aes.ts"/>
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
        console.log("Decrypted:" + decrypt);
    };
    return Cryptor;
}());

