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
        callback(hashed_pw.toString(), salt.toString(), iv.toString());
    };
    Cryptor.prototype.SetSaltAndIv = function (salt, iv) {
        console.log("iv and salt being set: " + salt);
        this.m_Iv = iv;
        this.m_Salt = salt;
    };
    Cryptor.prototype.GenerateRandom = function () {
        var numDigits = Math.floor(Math.random() * 4) + 1;
        var numSpecial = Math.floor(Math.random() * 4) + 1;
        var numUc = Math.floor(Math.random() * 4) + 1;
        var numLc = 16 - numDigits - numSpecial - numUc;
        var lcLetters = 'abcdefghijklmnopqrstuvwxyz';
        var ucLetters = lcLetters.toUpperCase();
        var numbers = '0123456789';
        var special = '!?=#*$@+-.';
        var getRand = function (values) {
            return values.charAt(Math.floor(Math.random() * values.length));
        };
        //+ Jonas Raoni Soares Silva
        //@ http://jsfromhell.com/array/shuffle [v1.0]
        function shuffle(o) {
            for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x)
                ;
            return o;
        }
        ;
        var pass = [];
        for (var i = 0; i < numLc; ++i) {
            pass.push(getRand(lcLetters));
        }
        for (var i = 0; i < numUc; ++i) {
            pass.push(getRand(ucLetters));
        }
        for (var i = 0; i < numDigits; ++i) {
            pass.push(getRand(numbers));
        }
        for (var i = 0; i < numSpecial; ++i) {
            pass.push(getRand(special));
        }
        return shuffle(pass).join('');
    };
    Cryptor.prototype.Encrypt = function (masterpassword, dataset) {
        if (!this.m_Iv || !this.m_Salt || this.m_Iv.length === 0 || this.m_Salt.length === 0) {
            console.log("Salt or Iv error");
            return;
        }
        //256 bit key, not necessary
        var key = CryptoJS.PBKDF2(masterpassword, this.m_Salt, {
            keySize: this.m_KeySize / 32,
            iterations: this.m_Iterations
        });
        dataset.Username = CryptoJS.AES.encrypt(dataset.Username, key.toString(), {
            iv: this.m_Iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });
        dataset.Username = dataset.Username.toString();
        dataset.Password = CryptoJS.AES.encrypt(dataset.Password, key.toString(), {
            iv: this.m_Iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });
        dataset.Password = dataset.Password.toString();
    };
    Cryptor.prototype.Decrypt = function (password, dataset) {
        var key = CryptoJS.PBKDF2(password, this.m_Salt, {
            keySize: this.m_KeySize / 32,
            iterations: this.m_Iterations
        });
        //decrypted
        dataset.Username = CryptoJS.AES.decrypt(dataset.Username, key.toString(), {
            iv: this.m_Iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });
        dataset.Username = dataset.Username.toString(CryptoJS.enc.Utf8);
        dataset.Password = CryptoJS.AES.decrypt(dataset.Password, key.toString(), {
            iv: this.m_Iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });
        dataset.Password = dataset.Password.toString(CryptoJS.enc.Utf8);
    };
    Cryptor.prototype.Hash = function (masterpassword) {
        var hashed_pw = CryptoJS.SHA256(masterpassword);
        return hashed_pw.toString();
    };
    return Cryptor;
}());
