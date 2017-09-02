// content-script which is injected into site

/*
port.onDisconnect.addListener((p) => {
  if (p.error) {
    console.log(`Disconnected due to an error: ${p.error.message}`);
  }
});
*/
/// <reference path="../Include/index.d.ts"/>

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
		let self = this;
		this.m_Port = chrome.runtime.connect({name: "filler"});
		this.m_Port.onMessage.addListener(function(msg:any,sender) {
			if (msg.Userdata)
				self.m_Filler.FillInInfo(msg.Userdata.Username, msg.Userdata.Password);	
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
		let form = <HTMLFormElement>this.m_Form;
		form.submit();
	}
}
var messenger = new ClientMessenger();



