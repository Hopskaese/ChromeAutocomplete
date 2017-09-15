
/// <reference path="../Include/index.d.ts"/>
/// <reference path="cryptor.ts"/>
///  <reference path="model.ts" />

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
				let hashed_pw = self.m_Cryptor.Hash(msg.MasterPassword);
				self.m_Model.GetMainData(function(dataset:any) {
					if (dataset.MainData.Hash == hashed_pw)
					{
						self.m_Cryptor.SetSaltAndIv(dataset.MainData.Salt, dataset.MainData.Iv);
						self.m_Port["options"].postMessage({Authenticated : {val : true}});
						self.m_Model.GetAllUserData(function(dataset:any) {
							for (let obj in dataset)
								self.m_Cryptor.Decrypt(msg.MasterPassword, dataset[obj]) 
						
							self.m_Port["options"].postMessage({UserData : dataset});
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
			 	let hashed_old = self.m_Cryptor.Hash(old_pw);
			 	let new_pw = msg.ChangeMasterPassword.NewPassword;
			 	self.m_Model.GetMainData(function(dataset:any) {
			 		if (dataset.MainData.Hash === hashed_old) 
			 		{
			 			let salt_old = dataset.MainData.Salt;
			 			let iv_old = dataset.MainData.Iv;
			 			self.m_Cryptor.MainSetup(new_pw, function(hashed_pw:string, salt:string, iv:string) {
			 					self.m_Model.SaveMainData(hashed_pw, salt, iv);
			 					self.m_Model.GetAllUserData(function(dataset:any) {
			 					for (let obj in dataset)
			 					{
			 						self.m_Cryptor.SetSaltAndIv(salt_old, iv_old);
			 						self.m_Cryptor.Decrypt(old_pw, dataset[obj]);
			 						self.m_Cryptor.SetSaltAndIv(salt, iv);
			 						self.m_Cryptor.Encrypt(new_pw, dataset[obj]);
			 						self.m_Model.SaveUserData(obj, dataset[obj].Username, dataset[obj].Password);
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
				let domain 		 = msg.ChangeUserData.Domain;
				let masterpassword = msg.ChangeUserData.MasterPassword;
				let id = msg.ChangeUserData.Id;

				let dataset_encrypted = self.m_Cryptor.Encrypt(masterpassword, msg.ChangeUserData);
				self.m_Model.SaveUserData(domain, msg.ChangeUserData.Username, msg.ChangeUserData.Password);

				self.m_Port["options"].postMessage({Success: "Data for "+domain+" has been changed"});
				self.m_Port["options"].postMessage({ResetInput: {val : id}});
			}
			else if (msg.GenerateRandom)
			{
				let id_element = msg.GenerateRandom.id;
				let random = self.m_Cryptor.GenerateRandom();
				let type_element = msg.GenerateRandom.type;

				self.m_Port["options"].postMessage({GenerateRandom : {val: random, id: id_element, type: type_element}});
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
		port.onMessage.addListener(function(msg:any) {
			if (msg.NewUserInfo && self.m_Domain)
			{
				self.m_Port["filler"].postMessage({Userdata : msg.NewUserInfo});
				let user: {[k: string]: any} = {Username: msg.NewUserInfo.Username, Password: msg.NewUserInfo.Password};
				self.m_Cryptor.Encrypt(msg.NewUserInfo.MasterPassword, user);
				self.m_Model.SaveUserData(self.m_Domain, user.Username, user.Password);
			}
			else if (msg.MasterPasswordSetup)
			{
				self.m_Model.GetMainData(function(isSetup:any) {
					if(isSetup == null)
						self.m_Cryptor.MainSetup(msg.MasterPasswordSetup, self.m_Model.SaveMainData);
				});
			}
			else if (msg.MasterPassword)
			{
				let hashed_pw = self.m_Cryptor.Hash(msg.MasterPassword);
				self.m_Model.GetMainData(function(dataset:any) {
					if (dataset.MainData.Hash == hashed_pw)
						self.m_Model.GetUserData(self.m_Domain, function(dataset:any) {
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
}

let messenger = new ServerMessenger();