
declare var CryptoJS:any;

//https://jsperf.com/crypto-js-pbkdf2-sha512
//https://stackoverflow.com/questions/20519166/cant-decrypt-string-with-cryptojs
class Cryptor {
	private m_KeySize :number;
	private m_IvSize :number;
	private m_Iterations: number;
	private m_Iv: string;
	private m_Salt: string;

	constructor() {
		this.m_KeySize = 256;
		this.m_IvSize = 128;
		this.m_Iterations = 100;
		this.m_Iv = "";
		this.m_Salt = "";
	}

	MainSetup(masterpassword:string, callback:(hashed_pw:string, salt:string, iv:string)=>void):void
	{
		let salt = CryptoJS.lib.WordArray.random(128/8);
		let iv  = CryptoJS.lib.WordArray.random(128/8);
		let hashed_pw = CryptoJS.SHA256(masterpassword);
		callback(JSON.stringify(hashed_pw), JSON.stringify(salt), JSON.stringify(iv));
	}

	SetIvAndSalt(iv:string, salt:string)
	{
		this.m_Iv = iv;
		this.m_Salt = salt;
	}

	Encrypt(username:string, password:string):void {
		if (!this.m_Iv || !this.m_Salt || this.m_Iv.length === 0 || this.m_Salt.length === 0)
			return;

		let key = CryptoJS.PBKDF2(password, this.m_Salt, {
			keySize: this.m_KeySize/32,
			iterations: this.m_Iterations
		});

		// remember to call encrypted.toString() before savin in database because its an object
		let encrypted = CryptoJS.AES.encrypt(username, key, {
			iv: this.m_Iv,
			padding: CryptoJS.pad.Pkcs7,
			mode: CryptoJS.mode.CBC
		});

		console.log("Encrypted username:"+ encrypted);
	}

	Decrypt(password:string, dataset:any, callback:(dataset:any)=>void):void {

		let key = CryptoJS.PBKDF2(password, this.m_Salt, {
			keySize: this.m_KeySize/32,
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

		console.log("Decrypted:"+ dataset);
	}

	Hash(masterpassword:string):string
	{
		let hashed_pw = CryptoJS.SHA256(masterpassword);
		return CryptoJS.enc.Utf8.stringify(hashed_pw);
	}
}