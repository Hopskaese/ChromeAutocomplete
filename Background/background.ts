
/// <reference path="../Include/index.d.ts"/>
/// <reference path="cryptor.ts"/>
/// <reference path="model.ts" />

class ServerMessenger {
	private m_Port :object;
	private m_Domain :string;
	private m_isFound :boolean;
	private m_Model	:Model;
	private m_Cryptor :Cryptor;

	constructor()
	{
		this.m_Model = new Model();
		this.m_Cryptor = new Cryptor();
		this.m_isFound = false;
		this.m_Port = {};
		this.InitListeners();
	}
	InitListeners():void {
		var self = this;
		chrome.runtime.onConnect.addListener(function(port:chrome.runtime.Port) {
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

				if (!self.m_isFound)
				{
					self.m_Port["popup"].postMessage({NoFormFound: "placeholder"});
					return;
				}

				self.m_Model.GetMainData(function(dataset:any) {
					if (dataset == null)
					{
						self.m_Port["popup"].postMessage({isNotSetup : "placeholder"});
					}
					else 
					{
						self.m_Cryptor.SetSaltAndIv(dataset.MainData.Salt, dataset.MainData.Iv);
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
			else if (port.name == "options")
			{
				console.log("options connected");
				self.InitOptionsListener(port);
			}
		});
	}
	InitOptionsListener(port:chrome.runtime.Port):void {
		var self = this;
		port.onMessage.addListener(function(msg:any) {
			if (msg.MasterPassword)
			{
				self.Authenticate(msg.MasterPassword, function(isAuthenticated:boolean, dataset:any) {
					if (isAuthenticated)
					{
						self.m_Cryptor.SetSaltAndIv(dataset.MainData.Salt, dataset.MainData.Iv);
						self.m_Port["options"].postMessage({Authenticated : {val : true}});

						self.m_Model.GetGeneralSettings(function(dataset2:any) {
							if (dataset)
								self.m_Port["options"].postMessage({Frequency: dataset2.GeneralSettings.Frequency});
							else
								self.m_Port["options"].postMessage({Error: "Could not retrieve Frequency, default value (0) will be used to calculate remaining."});
							
							self.GetDecryptedUserData(msg.MasterPassword, function(dataset3:any) {
								if (dataset3)
									self.m_Port["options"].postMessage({UserData : dataset3});
								else
									self.m_Port["options"].postMessage({Error: "Could not load or decrypt UserData"});
							});
						});
					}
					else
					{
						self.m_Port["options"].postMessage({Authenticated : {val : false}});
					}
				});
			}
			else if (msg.ChangeMasterPassword)
			{
			 	let old_pw = msg.ChangeMasterPassword.OldPassword;
			 	let new_pw = msg.ChangeMasterPassword.NewPassword;
			 	let error_msg = "";
			 	let error_domain = "";
			 	self.Authenticate(old_pw, function(isAuthenticated:boolean, dataset:any) {
			 		if (isAuthenticated) 
			 		{
			 			let salt_old = dataset.MainData.Salt;
			 			let iv_old = dataset.MainData.Iv;
			 			let cnt = 0;
			 			self.m_Cryptor.MainSetup(new_pw, function(hashed_pw:string, salt_new:string, iv_new:string) {
			 					self.m_Model.GetAllUserData(function(dataset2:any) {
			 					if (!dataset2)
			 					{
			 						self.m_Port["options"].postMessage({Error : "Unable to retrieve all UserData"});
			 						return;
			 					}
			 					for (let domain in dataset2)
			 					{
			 						self.m_Cryptor.SetSaltAndIv(salt_old, iv_old);

			 						self.m_Cryptor.Decrypt(old_pw, dataset2[domain]);
			 						if (dataset2[domain].Username.length == 0 || dataset2[domain].Password.length == 0)
			 						{
			 							error_msg = "Error during Decryption";
			 							error_domain = domain;
			 							break;
			 						}
			 						self.m_Cryptor.SetSaltAndIv(salt_new, iv_new);

			 						self.m_Cryptor.Encrypt(new_pw, dataset2[domain]);
			 						if (dataset2[domain].Username.length == 0 || dataset2[domain].Password.length == 0)
			 						{
			 							error_msg = "Error during Encryption";
			 							error_domain = domain;
			 							break;
			 						}

			 						self.m_Model.SaveUserData(domain, dataset2[domain].Username, dataset2[domain].Password, dataset2[domain].LastChanged, function(wasSuccessful:boolean) {
			 							if (!wasSuccessful)
			 							{
			 								error_msg = "Error during SaveUserData";
			 								error_domain = domain;
			 							}
			 						});

			 						if (error_msg.length != 0)
			 							break;
			 					}

			 					if (error_msg.length == 0)
			 					{
			 						self.m_Model.SaveMainData(hashed_pw, salt_new, iv_new);
			 						self.m_Port["options"].postMessage({Success: "Changed Master-Password"});
			 					}
			 					else
			 					{
			 						self.RevertToOldState(dataset2, error_domain, old_pw, new_pw, salt_old, iv_old, salt_new, iv_new);
			 						self.m_Port["options"].postMessage({Error: error_msg})
			 					}
			 				});
			 			});
			 		}
			 		else
			 		{
			 			self.m_Port["options"].postMessage({Error: "Wrong Master-Password"});
			 		}
			 	});
			}
			else if (msg.ChangeUserData)
			{
				var date = new Date();
				let domain = msg.ChangeUserData.Domain
				let masterpassword = msg.ChangeUserData.MasterPassword;
				let id = msg.ChangeUserData.Id;

				self.m_Cryptor.Encrypt(masterpassword, msg.ChangeUserData);
				if (msg.ChangeUserData.Username.length == 0 || msg.ChangeUserData.Password == 0)
				{
					self.m_Port["options"].postMessage({Error: "Could not encrypt UserData"});
					return;
				}
				self.m_Model.SaveUserData(domain, msg.ChangeUserData.Username, msg.ChangeUserData.Password, date.getTime(), function(wasSuccessful:boolean) {
					if (wasSuccessful)
					{
						self.m_Port["options"].postMessage({Success: "Data for "+domain+" has been changed"});
						self.m_Port["options"].postMessage({ResetInput: {val : id}});
					}
					else 
					{
						self.m_Port["options"].postMessage({Error: "Could save UserData"});
					}
				});
			}
			else if (msg.GenerateRandom)
			{
				let id_element = msg.GenerateRandom.id;
				let random = self.m_Cryptor.GenerateRandom();
				let type_element = msg.GenerateRandom.type;

				self.m_Port["options"].postMessage({GenerateRandom : {val: random, id: id_element, type: type_element}});
			}
			else if (msg.GeneralSettings)
			{
				self.m_Model.SaveGeneralSettings(msg.GeneralSettings.Frequency);
				self.GetDecryptedUserData(msg.GeneralSettings.MasterPassword, function(dataset:any) {
					if (dataset)
						self.m_Port["options"].postMessage({UpdatedUserData: dataset});
					else
						self.m_Port["options"].postMessage({Error : "Could not decrypt updated Userdata"});
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
			else if (msg.FormFound)
			{
				self.m_isFound = msg.FormFound.val;
			}
		});
	}
	InitPopupListener(port:chrome.runtime.Port):void {
		var self = this;
		var date = new Date();
		port.onMessage.addListener(function(msg:any) {
			if (msg.NewUserInfo && self.m_Domain)
			{
				self.m_Port["filler"].postMessage({Userdata : msg.NewUserInfo});
				let user: {[k: string]: any} = {Username: msg.NewUserInfo.Username, Password: msg.NewUserInfo.Password};
				self.m_Cryptor.Encrypt(msg.NewUserInfo.MasterPassword, user);
				if (user.Username.length == 0 || user.Password.length == 0)
				{
					self.m_Port["popup"].postMessage({Error: "Could not encrypt new UserData"});
					return;
				}
				self.m_Model.SaveUserData(self.m_Domain, user.Username, user.Password, date.getTime(), function(wasSuccessful:boolean) {
					if (wasSuccessful)
						self.m_Port["popup"].postMessage({Success : "Data saved"});
					else
						self.m_Port["popup"].postMessage({Error: "Could not save Data"});
				});
			}
			else if (msg.MasterPasswordSetup)
			{
				self.m_Model.GetMainData(function(isSetup:any) {
					if (!isSetup)
					{
						self.m_Cryptor.MainSetup(msg.MasterPasswordSetup, self.m_Model.SaveMainData);
						self.m_Model.SaveGeneralSettings();
					}
				});
			}
			else if (msg.MasterPassword)
			{
				self.Authenticate(msg.MasterPassword, function(isAuthenticated:boolean) {
					if (isAuthenticated)
						self.m_Model.GetUserData(self.m_Domain, function(dataset:any) {
							if (!dataset)
							{
								self.m_Port["popup"].postMessage({Error: "Could not retrieve UserData"});
								return;
							}
							self.m_Cryptor.Decrypt(msg.MasterPassword, dataset);
								if (dataset.Username.length === 0 || dataset.Password.length === 0)
									self.m_Port["popup"].postMessage({Error: "Could not decrypt data."});
								else
									self.m_Port["filler"].postMessage({Userdata : dataset});
						});
					else 
						self.m_Port["popup"].postMessage({Error : "Wrong Master Password"})
				});
			}
		});
	}

	Authenticate(Master_Password:string, callback:(isAuthenticated:boolean, dataset:any)=>any):void {
		let hashed_pw = this.m_Cryptor.Hash(Master_Password);
		var self = this;
		this.m_Model.GetMainData(function(dataset:any) {
			if (dataset.MainData.Hash == hashed_pw)
			{
				self.m_Cryptor.SetSaltAndIv(dataset.MainData.Salt, dataset.MainData.Iv);
				callback(true, dataset);
			}
			else
			{
				callback(false, dataset);
			}
		});
	}

	GetDecryptedUserData(Master_Password:string, callback:(dataset:any)=>any):void {
		let self = this;
		this.m_Model.GetAllUserData(function(dataset:any) {

			if(!dataset)
			{
				callback(null);
				return;
			}
			for (let obj in dataset)
			{
				self.m_Cryptor.Decrypt(Master_Password, dataset[obj]);

				if (dataset[obj].Username.length == 0 || dataset[obj].Password.length == 0)
				{
					callback(null);
					return;
				}
			}
			callback(dataset);
		});
	}

	RevertToOldState(dataset:any, domain:string, old_pw:string, new_pw:string, salt_old, iv_old, salt_new, iv_new):void {
		for (let obj in dataset)
		{
			if (domain == obj)
				break;
			
			this.m_Cryptor.SetSaltAndIv(salt_new, iv_new);
			this.m_Cryptor.Decrypt(new_pw, dataset[obj]);
			this.m_Cryptor.SetSaltAndIv(salt_old, iv_old);
			this.m_Cryptor.Encrypt(old_pw, dataset[obj]);
			this.m_Model.SaveUserData(obj, dataset[obj].Username, dataset[obj].Password, dataset[obj].LastChanged, function(wasSuccessful:boolean){});
		}
	}
}

let messenger = new ServerMessenger();