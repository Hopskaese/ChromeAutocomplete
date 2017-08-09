
/// <reference path="../include/index.d.ts"/>
class ServerMessenger {
	private m_Port :object;
	private m_Domain :string;
	private m_Model	:Model;

	constructor()
	{
		this.m_Model = new Model();
		this.m_Port = {};
		this.InitListeners();
	}
	InitListeners():void {
		var self = this;
		chrome.runtime.onConnect.addListener(function(port) {
			self.m_Port[port.name] = port;

			if (port.name == "filler")
			{
				self.InitFillerListener(port);
			}
			else if (port.name == "popup"
)			{
				let doesExist = false;
				if (self.m_Domain)
				{
					let dataset = self.m_Model.GetUserData(this.m_Domain);
					if (dataset)
						doesExist = true;				
				}
				self.InitPopupListener(port);
				self.m_Port["popup"].postMessage({DomainExists : {val : doesExist}})
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
			if (msg.NewUserInfo && this.m_Domain)
			{
				let user = msg.Userinfo;
				self.m_Model.SaveUserData(self.m_Domain, user.Username, user.Password);
			}
			else if (msg.MasterPassword)
			{
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

class Model {
	constructor(){}
	SaveUserData(domain:string, username:string, password:string):void {
		let credentials = {"Username": username, "Password":password};
		chrome.storage.local.set({domain : credentials}, function() {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
				console.log("Last error" + lasterror.message);

		});
	}
	GetUserData(domain:string): any {
		chrome.storage.local.get(domain, function(dataset) {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
			{
				console.log("Error retrieving value from storage" + lasterror.message);
				return null;
			}
			return dataset;
		});
	}
	Authenticate(password:string) {

	}
}

let messenger = new ServerMessenger();
