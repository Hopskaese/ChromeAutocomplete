//https://jsperf.com/crypto-js-pbkdf2-sha512
//https://stackoverflow.com/questions/20519166/cant-decrypt-string-with-cryptojs
var Cryptor = (function () {
    function Cryptor() {
        this.m_KeySize = 256;
        this.m_IvSize = 128;
        this.m_Iterations = 100;
        this.m_Iv = "";
        this.m_Salt = "";
    }
    Cryptor.prototype.MainSetup = function (masterpassword, callback) {
        var salt = CryptoJS.lib.WordArray.random(128 / 8);
        var iv = CryptoJS.lib.WordArray.random(128 / 8);
        var hashed_pw = CryptoJS.SHA256(masterpassword);
        callback(JSON.stringify(hashed_pw), JSON.stringify(salt), JSON.stringify(iv));
    };
    Cryptor.prototype.SetIvAndSalt = function (iv, salt) {
        this.m_Iv = iv;
        this.m_Salt = salt;
    };
    Cryptor.prototype.Encrypt = function (username, password) {
        if (!this.m_Iv || !this.m_Salt || this.m_Iv.length === 0 || this.m_Salt.length === 0)
            return;
        var key = CryptoJS.PBKDF2(password, this.m_Salt, {
            keySize: this.m_KeySize / 32,
            iterations: this.m_Iterations
        });
        // remember to call encrypted.toString() before savin in database because its an object
        var encrypted = CryptoJS.AES.encrypt(username, key, {
            iv: this.m_Iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });
        console.log("Encrypted username:" + encrypted);
    };
    Cryptor.prototype.Decrypt = function (password, dataset, callback) {
        var key = CryptoJS.PBKDF2(password, this.m_Salt, {
            keySize: this.m_KeySize / 32,
            iterations: this.m_Iterations
        });
        //decrypt
        dataset.Username = CryptoJS.AES.decrypt(dataset.Username, key, {
            iv: this.m_Iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });
        dataset.Password = CryptoJS.AES.decrypt(dataset.Password, key, {
            iv: this.m_Iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });
        callback(dataset);
        console.log("Decrypted:" + dataset);
    };
    Cryptor.prototype.Hash = function (masterpassword) {
        var hashed_pw = CryptoJS.SHA256(masterpassword);
        return CryptoJS.enc.Utf8.stringify(hashed_pw);
    };
    return Cryptor;
}());
