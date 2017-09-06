/// <reference path="../Include/index.d.ts"/>
/// <reference path="../Include/index2.d.ts"/>

class OptionsMessenger {
	private m_Port:chrome.runtime.Port;
  private m_Manager:OptionsManager;
	constructor(manager:OptionsManager) {
    this.m_Manager = manager;
    this.InitListeners();
  }
  InitListeners():void {
    this.m_Port = chrome.runtime.connect({name:"options"});
    let self = this;
    this.m_Port.onMessage.addListener(function(msg:any, sender:chrome.runtime.Port) {
    	if (msg.Authenticated)
    	{
    		if (msg.Authenticated.val) 
    		{
    			self.m_Manager.SetupAuthenticated();
    		}
    		else
    		{
    			self.m_Manager.ShowElement("error-messages");
    		}
    	}
    });
  } 
  PostMessage(input:object):void {
    this.m_Port.postMessage(input);
  }
}

class OptionsManager {
	private m_Messenger:OptionsMessenger;
	constructor() {
		this.m_Messenger = new OptionsMessenger(this);
		this.InitListeners();
	}
	InitListeners():void {
		let self = this;
		$(document).ready(function() {
			$('#error-messages').hide();
			$('#auth-yes').hide();
			$('#unlocked').hide();

			$('#btn-authenticate').on("click", function() {
				let password = (<HTMLInputElement>document.getElementById("master-password-input")).value;
        	if (password)
          		self.m_Messenger.PostMessage({MasterPassword: password});
			});
		});
	}
	ShowElement(id:string):void {
		$("#"+id).show();
	}
	HideElement(id:string):void {
		$("#"+id).hide();
	}
	SetupAuthenticated():void {
		$('#error-messages').hide();
		$('#locked').hide();
		$('#unlocked').show();
		$('.panel').fadeOut(1500);
		$('#auth-no').hide();
		$('#auth-yes').show();
	}
}

var manager = new OptionsManager();


