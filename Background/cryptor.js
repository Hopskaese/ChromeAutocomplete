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
        console.log(iv.toString());
        callback(hashed_pw.toString(), salt.toString(), iv.toString());
    };
    Cryptor.prototype.SetIvAndSalt = function (iv, salt) {
        console.log("iv and salt being set: " + iv);
        this.m_Iv = iv;
        this.m_Salt = salt;
    };
    Cryptor.prototype.Encrypt = function (username, password, callback) {
        if (!this.m_Iv || !this.m_Salt || this.m_Iv.length === 0 || this.m_Salt.length === 0) {
            console.log("Salt or Iv error");
            return;
        }
        //256 bit key
        var key = CryptoJS.PBKDF2(password, this.m_Salt, {
            keySize: this.m_KeySize / 32,
            iterations: this.m_Iterations
        });
        username = CryptoJS.AES.encrypt(username, key.toString(), {
            iv: this.m_Iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });
        password = CryptoJS.AES.encrypt(password, key.toString(), {
            iv: this.m_Iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });
        callback(username.toString(), password.toString());
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
        console.log("Decrypted pw: " + dataset.Password);
        callback(dataset);
    };
    Cryptor.prototype.Hash = function (masterpassword) {
        var hashed_pw = CryptoJS.SHA256(masterpassword);
        return CryptoJS.enc.Utf8.stringify(hashed_pw);
    };
    return Cryptor;
}());
