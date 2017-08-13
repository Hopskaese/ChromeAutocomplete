
/// <reference path="../Include/aes.ts"/>

class Cryptor {
	private m_KeySize :number;
	private m_IvSize :number;
	private m_Iterations: number;

	constructor() {
		this.m_KeySize = 256;
		this.m_IvSize = 128;
		this.m_Iterations = 100;
	}

	Encrypt(username:string, password:string):void {
		let pass= "test";
		let salt = CryptoJS.lib.WordArray.random(128/8);

		let key = CryptoJS.PBKDF2(pass, salt, {
			keySize: this.m_KeySize/32,
			iterations: this.m_Iterations
		});

		let iv = CryptoJS.lib.WordArray.random(128/8);

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

		console.log("Decrypted:"+ decrypt);
	}
}