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
    	else if (msg.UserData)
    	{
    		self.m_Manager.SetupUserData(msg.UserData);
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
			$('#data-table').hide();
			$('#auth-yes').hide();
			$('#unlocked').hide();

			$('#btn-authenticate').on("click", function() {
				let password = (<HTMLInputElement>document.getElementById("master-password-input")).value;
        		if (password)
          			self.m_Messenger.PostMessage({MasterPassword: password});
			});
			$(document).keyup(function(event) {
				if (event.keyCode == 13) {
					$("#btn-authenticate").click();
				}
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
		$('.panel').fadeOut(1500, function() {
			$('#data-table').show();
		});
		$('#auth-no').hide();
		$('#auth-yes').show();
	}
	SetupUserData(dataset:any)
	{
		console.info(dataset);
		let cnt = 0;
		for (let obj in dataset) 
		{
			$('tbody').append('<tr>\
      						   <th scope="row">'+cnt+'</th>\
      						   <td>'+obj+'</td>\
                               <td>'+dataset[obj].Username+'</td>\
                               <td>'+dataset[obj].Password+'</td>\
                               </tr>');
			cnt++;
		}
	}
}

var manager = new OptionsManager();


