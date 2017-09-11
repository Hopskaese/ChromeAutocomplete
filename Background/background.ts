
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
						self.m_Cryptor.SetIvAndSalt(dataset.MainData.Salt, dataset.MainData.Iv);
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
			 	let old_pw = msg.ChangeMasterPassword.old_pw;
			 	let hashed_old = self.m_Cryptor.Hash(old_pw);
			 	let new_pw = msg.ChangeMasterPassword.new_pw;
			 	let hashed_new = self.m_Cryptor.Hash(new_pw);
			 	self.m_Model.GetMainData(function(dataset:any) {
			 		if (dataset.MainData.Hash === hashed_old) 
			 		{
			 			self.m_Model.GetAllUserData(function(dataset:any) {
			 				for (let obj in dataset)
			 				{
			 					self.m_Cryptor.Decrypt(old_pw, dataset[obj]);
			 					self.m_Cryptor.Encrypt(new_pw, dataset[obj].Username, dataset[obj].Password);
			 					self.m_Model.DeleteRecord(obj);
			 					self.m_Model.SaveUserData(obj, dataset[obj].Username, dataset[obj].Password);
			 				}
			 			});

			 			self.m_Model.DeleteRecord("MainData");
			 			self.m_Model.SaveMainData(hashed_new, dataset.MainData.Iv, dataset.MainData.Salt);
			 		}
			 		else
			 		{
			 			self.m_Port["options"].postMessage({Error: "Wrong Master-Password"});
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
				self.m_Cryptor.Encrypt(user.Username, user.Password, user.MasterPassword);
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