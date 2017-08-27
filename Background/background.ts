
/// <reference path="../Include/index.d.ts"/>
/// <reference path="cryptor.ts"/>
///  <reference path="model.ts" />

class ServerMessenger {
	private m_Port :object;
	private m_Domain :string;
	private m_Model	:Model;
	private m_Cryptor :Cryptor;

	constructor()
	{
		this.m_Model = new Model();
		this.m_Cryptor = new Cryptor();
		this.m_Port = {};
		this.InitListeners();
	}
	InitListeners():void {
		var self = this;
		chrome.runtime.onConnect.addListener(function(port) {
			self.m_Port[port.name] = port;

			if (port.name == "filler")
			{
				console.log("filler connected");
				self.InitFillerListener(port);
			}
			else if (port.name == "popup")			
			{
				console.log("popup connected");
				self.InitPopupListener(port);

				self.m_Model.GetMainData(function(dataset:any) {
					if (dataset == null)
					{
						self.m_Port["popup"].postMessage({isNotSetup : "placeholder"});
					}
					else 
					{
						self.m_Cryptor.SetIvAndSalt(dataset.MainData.Salt, dataset.MainData.Iv);
						let doesExist = false;
						if (self.m_Domain)
						{
							self.m_Model.GetUserData(self.m_Domain, function(dataset) {
							if (dataset)
								doesExist = true;	

							self.m_Port["popup"].postMessage({DomainExists : {val : doesExist}});
						});			
						}
					}
				});
			}
		});
	}
	InitFillerListener(port:chrome.runtime.Port):void {
		var self = this;
		port.onMessage.addListener(function(msg:any) {
			if (msg.Domain)
			{
				self.m_Domain = msg.Domain;
			}
		});
	}
	InitPopupListener(port:chrome.runtime.Port):void {
		var self = this;
		port.onMessage.addListener(function(msg:any) {
			if (msg.NewUserInfo && self.m_Domain)
			{
				let user = msg.NewUserInfo;
				self.m_Cryptor.Encrypt(user.Username, user.Password, function(encrypted_Username, encrypted_Password) {
					console.log("Encrypted data"+ encrypted_Password+ " "+ encrypted_Username);
					self.m_Model.SaveUserData(self.m_Domain, encrypted_Username, encrypted_Password);
				});
			}
			else if (msg.MasterPasswordSetup)
			{
				self.m_Model.GetMainData(function(isSetup:any) {
					if(isSetup == null)
						self.m_Cryptor.MainSetup(msg.MasterPassword, self.m_Model.SaveMainData);
				});
			}
			else if (msg.MasterPassword)
			{
				let hashed_pw = self.m_Cryptor.Hash(msg.MasterPassword);
				self.m_Model.Authenticate(hashed_pw, function(result:boolean) {
					if (result)
						self.m_Model.GetUserData(self.m_Domain, function(dataset) {
							if (dataset)
								self.m_Cryptor.Decrypt(msg.MasterPassword, dataset, function(decrypted_dataset) {
									if (decrypted_dataset.Username.length() === 0 || decrypted_dataset.Password.length() === 0)
										self.m_Port["popup"].postMessage({Error: "Could not decrypt data."});
									else
										self.m_Port["filler"].postMessage({Userdata : dataset});
								});
						});
					else 
						self.m_Port["popup"].postMessage({Error : "Wrong Master Password"})
				});
			}
		});
	}
}

let messenger = new ServerMessenger();