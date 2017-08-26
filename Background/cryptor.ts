
declare var CryptoJS:any;

//https://jsperf.com/crypto-js-pbkdf2-sha512
//https://stackoverflow.com/questions/20519166/cant-decrypt-string-with-cryptojs
class Cryptor {
	private m_KeySize :number;
	private m_IvSize :number;
	private m_Iterations: number;

	constructor() {
		this.m_KeySize = 256;
		this.m_IvSize = 128;
		this.m_Iterations = 100;
	}

	MainSetup(masterpassword:string, callback:(hashed_pw:string, salt:string, iv:string)=>void):void
	{
		let salt = CryptoJS.lib.WordArray.random(128/8);
		let iv  = CryptoJS.lib.WordArray.random(128/8);
		let hashed_pw = CryptoJS.SHA256(masterpassword);
		callback(CryptoJS.enc.Utf8.stringify(hashed_pw), CryptoJS.enc.Utf8.stringify(salt), CryptoJS.enc.Utf8.stringify(iv));
	}

	Encrypt(username:string, password:string):void {
		let pass= "test";
		let salt = CryptoJS.lib.WordArray.random(128/8);
		let key = CryptoJS.PBKDF2(pass, salt, {
			keySize: this.m_KeySize/32,
			iterations: this.m_Iterations
		});

		let iv = CryptoJS.lib.WordArray.random(128/8);

		// remember to call encrypted.toString() before savin in database because its an object
		let encrypted = CryptoJS.AES.encrypt(username, key, {
			iv: iv,
			padding: CryptoJS.pad.Pkcs7,
			mode: CryptoJS.mode.CBC
		});

		console.log("Encrypted username:"+ encrypted);

		//decrypt
		let decrypt = CryptoJS.AES.decrypt(encrypted, key, {
			iv: iv,
			padding: CryptoJS.pad.Pkcs7,
			mode: CryptoJS.mode.CBC
		});

		console.log("Decrypted:"+ decrypt.toString(CryptoJS.enc.Utf8));
	}

	Hash(masterpassword:string):string
	{
		let hashed_pw = CryptoJS.SHA256(masterpassword);
		return CryptoJS.enc.Utf8.stringify(hashed_pw);
	}
}