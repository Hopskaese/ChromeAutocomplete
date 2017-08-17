
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

				self.m_Model.GetMainData(function(dataset) {
					console.log("In getmaindata callback");
					if(!dataset)
					{
						self.m_Port["popup"].postMessage({isNotSetup : "placeholder"});
					}
					else 
					{
						let doesExist = false;
						if (self.m_Domain)
						{
							self.m_Model.GetUserData(self.m_Domain, function(dataset) {
							console.log("Returned data:"+dataset);
							if (dataset)
								doesExist = true;	

							self.m_Port["popup"].postMessage({DomainExists : {val : doesExist}})
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
			console.log("Popup msg:"+ msg.NewUserInfo);
			if (msg.NewUserInfo && self.m_Domain)
			{
				let user = msg.NewUserInfo;
				self.m_Model.SaveUserData(self.m_Domain, user.Username, user.Password);
			}
			else if (msg.MasterPasswordSetup)
			{
				self.m_Cryptor.MainSetup(msg.MasterPassword, self.m_Model.SaveMainData);
			}
			else if (msg.MasterPassword)
			{
				console.log("going to encrypt masterpassword"+ msg.MasterPassword);
				self.m_Cryptor.Encrypt("sadasdas",msg.MasterPassword);

				//self.m_Port["filler"].postMessage({Userdata : self.m_Model.GetCurDataset()})
				/*
				Authenticate();
				let credentials = Model.GetUserData(m_Domain);
				m_Port["filler"].postMessage({"credentials" : credentials});
				
				var dataset = Model.GetUserData(m_Domain);
				if (dataset)
					m_Port["filler"].postMessage({"Credentials" : credentials});
				else
				{}
				Implement general error class.
				*/
			}
		});
	}

}

let messenger = new ServerMessenger();