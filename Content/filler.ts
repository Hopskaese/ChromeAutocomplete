// content-script which is injected into site

/*
port.onDisconnect.addListener((p) => {
  if (p.error) {
    console.log(`Disconnected due to an error: ${p.error.message}`);
  }
});
*/
/// <reference path="../include/index.d.ts"/>

class ClientMessenger {
	m_Port:chrome.runtime.Port;
	m_Filler:Filler;
	constructor()
	{
		this.m_Filler = new Filler();
		this.m_Filler.InitFormObject();
		this.InitListeners();
	}
	InitListeners():void {
		this.m_Port = chrome.runtime.connect({name: "filler"});

		this.m_Port.onMessage.addListener(function(msg:any,sender) {
			if (msg.Credentials)
			{
				let user = msg.Credentials[0];

				if (user)
					this.m_Filler.FillInInfo(user.username, user.password);
			}
		});

		this.PostMessage({Domain: document.domain});
	}
	PostMessage(input):void {
		this.m_Port.postMessage(input);
	}
}

class Filler {
	private m_FormObject:object;
	private m_Form:object;
	constructor(){}
	InitFormObject():void {
		var forms = document.forms;

		for (let i = 0; i < forms.length; i++) {
			let input_user = forms[i].querySelector('input[type="text"]');
			let input_email = forms[i].querySelector('input[type="email"]');
			let input_pw = forms[i].querySelector('input[type="password"]');

			if (input_user != null || input_email != null && input_pw != null)
			{
				this.m_Form = forms[i];
				this.m_FormObject = new Array();
				this.m_FormObject["username"] = input_user || input_email;
				this.m_FormObject["password"] = input_pw;

				break;
			}
		}
	}
	FillInInfo(username:string, password:string):void {
		this.m_FormObject["username"].value = username;
		this.m_FormObject["password"].value = password;
	}
}
var messenger = new ClientMessenger();



