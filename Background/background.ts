
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
					self.m_Cryptor.SetSaltAndIv(dataset.MainData.Salt, dataset.MainData.Iv);
					if (self.m_Domain)
					{
						self.m_Model.GetUserData(self.m_Domain, function(dataset) {
							self.m_Port["popup"].postMessage({DomainExists : {val : true}});
						}, function() {
							self.m_Port["popup"].postMessage({DomainExists : {val : false}});
						});			
					}
				}, function() {
					self.m_Port["popup"].postMessage({isNotSetup : "placeholder"});
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
							self.m_Port["options"].postMessage({Frequency: dataset2.GeneralSettings.Frequency});
							
							self.GetDecryptedUserData(msg.MasterPassword, function(dataset3:any) {
								if (dataset3)
									self.m_Port["options"].postMessage({UserData : dataset3});
								else
									self.m_Port["options"].postMessage({Error: "Could not load or decrypt UserData"});
							});
						}, function() {
							self.m_Port["options"].postMessage({Error: "Could not retrieve Frequency, default value (0) will be used to calculate remaining."});
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
			 					self.m_Model.GetAllUserData(function(dataset_UserData:any) {
			 					if (!dataset_UserData)
			 					{
			 						self.m_Port["options"].postMessage({Error : "Unable to retrieve all UserData"});
			 						return;
			 					}
			 					for (let domain in dataset_UserData)
			 					{
			 						self.m_Cryptor.SetSaltAndIv(salt_old, iv_old);

			 						self.m_Cryptor.Decrypt(old_pw, dataset_UserData[domain]);
			 						if (dataset_UserData[domain].Username.length == 0 || dataset_UserData[domain].Password.length == 0)
			 						{
			 							error_msg = "Error during Decryption";
			 							error_domain = domain;
			 							break;
			 						}
			 						self.m_Cryptor.SetSaltAndIv(salt_new, iv_new);

			 						self.m_Cryptor.Encrypt(new_pw, dataset_UserData[domain]);
			 						if (dataset_UserData[domain].Username.length == 0 || dataset_UserData[domain].Password.length == 0)
			 						{
			 							error_msg = "Error during Encryption";
			 							error_domain = domain;
			 							break;
			 						}

			 						self.m_Model.SaveUserData(domain, dataset_UserData[domain].Username, dataset_UserData[domain].Password,
			 							dataset_UserData[domain].LastChanged, function() {
			 						}, function() {
			 							error_msg = "Error during SaveUserData";
			 							error_domain = domain;
			 						});

			 						if (error_msg.length != 0)
			 							break;
			 					}

			 					if (error_msg.length == 0)
			 					{
			 						self.m_Model.SaveMainData(hashed_pw, salt_new, iv_new, function() {
			 							self.m_Port["options"].postMessage({Success: "Changed Master-Password"});
			 						}, function(){
			 							self.m_Port["options"].postMessage({Error: "Could not save MainData. Everything is probably broken now."});
			 						});
			 					}
			 					else
			 					{
			 						self.RevertToOldState(dataset_UserData, error_domain, old_pw, new_pw, salt_old, iv_old, salt_new, iv_new);
			 						self.m_Port["options"].postMessage({Error: error_msg})
			 					}
			 				}, function(){

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
				self.m_Model.SaveUserData(domain, msg.ChangeUserData.Username, msg.ChangeUserData.Password, date.getTime(), 
					function() {
						self.m_Port["options"].postMessage({Success: "Data for "+domain+" has been changed"});
						self.m_Port["options"].postMessage({ResetInput: {val : id}});
					}, function() {
						self.m_Port["options"].postMessage({Error: "Could save UserData"});
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
				self.m_Model.SaveGeneralSettings(msg.GeneralSettings.Frequency,
				   function() {}, 
				   function() {
					self.m_Port["options"].postMessage({Error: "Could not save Generalsettings"});
					return;
				});
				self.GetDecryptedUserData(msg.GeneralSettings.MasterPassword, function(dataset:any) {
					if (dataset)
						self.m_Port["options"].postMessage({UpdatedUserData: dataset});
					else
						self.m_Port["options"].postMessage({Error : "Could not decrypt updated Userdata"});
				});
			}
			else if (msg.CreateBackup)
			{
				self.m_Model.GetAllUserData(function(dataset_UserData:any) {			
					self.m_Model.GetMainData(function(dataset_MainData:any) {
						self.m_Model.GetGeneralSettings(function(dataset_GeneralSettings:any) {
							let dataset:any = (Object as any).assign({}, dataset_UserData, dataset_MainData, dataset_GeneralSettings);	
						self.CreateBackup(JSON.stringify(dataset), function(err_msg:string) {
							self.m_Port["options"].postMessage({Error : err_msg});
						});
				}, function() {
				   		self.m_Port["options"].postMessage({Error : "Unable to retrieve GeneralSettings"});
				   		return;
					});
				}, function() {
						self.m_Port["options"].postMessage({Error : "Unable to retrieve MainData"});
						return;
					});
				}, function() {
						self.m_Port["options"].postMessage({Error : "Unable to retrieve all UserData"});
						return;
					});
			}
			else if (msg.LoadBackup) 
			{
				try 
				{
					let error_msg = "";
					let dataset:any = JSON.parse(msg.LoadBackup);
					for (var obj in dataset) {
						if (obj == "MainData")
							self.m_Model.SaveMainData(dataset[obj].Hash, dataset[obj].Salt, dataset[obj].Iv,
								function(){},
								function() {
									error_msg = "Unable to save backup data";
								});
						else if (obj == "GeneralSettings")
							self.m_Model.SaveGeneralSettings(dataset[obj].Frequency,
								function(){},
								function(){
									error_msg = "Unable to save backup data";
								});
						else
							self.m_Model.SaveUserData(obj, dataset[obj].Username, dataset[obj].Password, dataset[obj].LastChanged,
							 	function(){},
								function(){
									error_msg = "Unable to save backup data";
								});
					}

					if (error_msg)
					{
						self.m_Port["options"].postMessage({Error : "Could not load Backup"});
						//deleting MainData so cant login and maybe see corrupted data
						chrome.storage.local.remove("MainData");
					}
					else
					{
						self.m_Port["options"].postMessage({Success: "Backup loaded"});
					}
					
				} catch (e) {
					self.m_Port["options"].postMessage({Error : "Corrupted JSON " + e});
				
							}
			}
			else if (msg.DeleteRecord)
			{
				self.m_Model.DeleteRecord(msg.DeleteRecord, function() {
					self.m_Port["options"].postMessage({Success: "Record deleted"});
				}, function() {
					self.m_Port["options"].postMessage({Error : "Could not delete record"});
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
				self.m_Model.SaveUserData(self.m_Domain, user.Username, user.Password, date.getTime(),
					function() {
						self.m_Port["popup"].postMessage({Success : "Data saved"});
					}, function() {
						self.m_Port["popup"].postMessage({Error: "Could not save Data"});
					});
			}
			else if (msg.MasterPasswordSetup)
			{
				self.m_Model.GetMainData(function(isSetup:any) {
				}, function() {
					self.m_Cryptor.MainSetup(msg.MasterPasswordSetup, function(hashed_pw:string, salt:string, iv:string) {
						self.m_Model.SaveMainData(hashed_pw, salt, iv, function() {
							self.m_Port["popup"].postMessage({Success: "Saved MasterPassword"});
						}, function() {
							self.m_Port["popup"].postMessage({Error: "Could not save MasterPassword"});
						});	
					});
					self.m_Model.SaveGeneralSettings(30, function(){}, function(){});
				});
			}
			else if (msg.MasterPassword)
			{
				self.Authenticate(msg.MasterPassword, function(isAuthenticated:boolean) {
					if (isAuthenticated)
						self.m_Model.GetUserData(self.m_Domain, function(dataset_UserData:any) {
							self.m_Cryptor.Decrypt(msg.MasterPassword, dataset_UserData);
								if (dataset_UserData.Username.length === 0 || dataset_UserData.Password.length === 0)
									self.m_Port["popup"].postMessage({Error: "Could not decrypt data."});
								else
									self.m_Port["filler"].postMessage({Userdata : dataset_UserData});
						}, function(){
							self.m_Port["popup"].postMessage({Error: "Could not retrieve UserData"});
							return;
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
		}, function() {
			console.log("Error while trying to retrieve MainData");
		});
	}

	GetDecryptedUserData(Master_Password:string, callback:(dataset:any)=>any):void {
		let self = this;
		this.m_Model.GetAllUserData(function(dataset:any) {
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
		}, function() {
			callback(null);
			return;
		});
	}

	RevertToOldState(dataset:any, domain:string, old_pw:string, new_pw:string, salt_old, iv_old, salt_new, iv_new):void {
		let self = this;
		for (let obj in dataset)
		{
			if (domain == obj)
				break;
			
			this.m_Cryptor.SetSaltAndIv(salt_new, iv_new);
			this.m_Cryptor.Decrypt(new_pw, dataset[obj]);
			this.m_Cryptor.SetSaltAndIv(salt_old, iv_old);
			this.m_Cryptor.Encrypt(old_pw, dataset[obj]);
			this.m_Model.SaveUserData(obj, dataset[obj].Username, dataset[obj].Password, dataset[obj].LastChanged,
				function(){},
				function() {
					self.m_Port["options"].postMessage({Error : "Everything is fucked up now"});
				});
		}
	}

	CreateBackup(data:string, callback:(error_msg:string)=>any):void {
		let self = this;
		(window as any).requestFileSystem = (window as any).requestFileSystem || (window as any).webkitRequestFileSystem;
		(window as any).requestFileSystem((window as any).TEMPORARY, 1024*1024, function(fs:any) {
			fs.root.getFile('backup.txt', {create : true}, function(fileEntry:any) {
				fileEntry.createWriter(function(fileWriter:any) {

					fileWriter.onwriteend = function(e:any) {
						chrome.downloads.download({
							url: fileEntry.toURL()
						});
					};

					fileWriter.onerror = function(e:any) {
						callback(e.toString());
					};

					let blob = new Blob([data], {type: 'text/plain'});
					fileWriter.write(blob);

				}, function(e:any) {
				   callback(e.toString());
			       }
			    );
			}, function(e:any) {
			   callback(e.toString());
			   }
			);
		}, function(e:any){
		   callback(e.toString());
		   }
		);
	}
}

let messenger = new ServerMessenger();