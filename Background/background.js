
var ServerMessenger = {
	m_Port : {},
	m_Domain : null,
	
	InitListeners: function() {
		chrome.runtime.onConnect.addListener(function(port) {
			m_Port[port.name] = port;
			
			if (port.name = "filler")
				InitFillerListener();
			else if (port.name = "popup")
			{
				var doesExist = false;
				if (m_Domain)
				{
					var dataset = GetUserData(m_Domain);
					if (dataset)
						doesExist = true;				
				}
				m_Port["popup"].postMessage({DomainExists : {val: doesExists}})
				InitPopupListener();
			}
		});
	},
	InitFillerListener: function(port) {
		port.onMessage.addListener(function(msg) {
			if (msg.Domain)
			{
				m_Domain = msg.Domain;
			}
		});
	},
	InitPopupListener: function(port) {
		port.onMessage.addListener(function(msg) {
			if (msg.NewUserInfo && m_Domain)
			{
				let user = msg.Userinfo;
				Model.SaveUserData(m_Domain, user.Username, user.Password);
			}
			else if (msg.MasterPassword)
			{
				/*
				Authenticate();
				let credentials = Model.GetUserData(m_Domain);
				m_Port["filler"].postMessage({"credentials" : credentials});
				*/
				var dataset = Model.GetUserData(m_Domain);
				if (dataset)
					m_Port["filler"].postMessage({"Credentials" : credentials});
				else
				{}
				// Implement general error class.
			}
		});
	},
}

var Model = {
	SaveUserData: function(domain, username, password) {
		var credentials = {"Username": username, "Password": password};
		chrome.storage.local.set({domain : credentials}, function() {
			var LastError = chrome.runtime.lastError;
			if (LastError)
				console.log("Last error:" + LastError.message);
		});
	},
	GetUserData: function(domain) {
		chrome.storage.local.get(domain, function(dataset) {
			var LastError = chrome.runtime.lastError;
			if (LastError)
			{
				console.log("Error retrieving value from storage" + LastError.message);
				return null;
			}
			return dataset;
		});
	},
	Authenticate: function(domain) {

	}
}

ServerMessenger.InitListeners();
