
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
		callback(hashed_pw.toString(), salt.toString(), iv.toString());
	}

	SetIvAndSalt(iv:string, salt:string)
	{
		console.log("iv and salt being set: "+iv);
		this.m_Iv = iv;
		this.m_Salt = salt;
	}

	Encrypt(username:string, password:string , masterpassword:string, callback:(encrypted_Username:string, encrypted_Password:string)=>void):void {
		
		if (!this.m_Iv || !this.m_Salt || this.m_Iv.length === 0 || this.m_Salt.length === 0)
		{
			console.log("Salt or Iv error");
			return;
		}
		
		//256 bit key
		let key = CryptoJS.PBKDF2(masterpassword, this.m_Salt, {
			keySize: this.m_KeySize/32,
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
	}

	Decrypt(password:string, dataset:any):void {
		let key = CryptoJS.PBKDF2(password, this.m_Salt, {
			keySize: this.m_KeySize/32,
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
	}

	Hash(masterpassword:string):string
	{
		let hashed_pw = CryptoJS.SHA256(masterpassword);
		return hashed_pw.toString();
	}
}