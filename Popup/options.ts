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
    			$('#error-messages').text("Wrong Master-Password!");
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
	private m_isAuthenticated:boolean;
	constructor() {
		this.m_Messenger = new OptionsMessenger(this);
		this.InitListeners();
	}
	InitListeners():void {
		let self = this;
		$(document).ready(function() {
			$('#error-messages').hide();
			$('#data-table').hide();
			$('#change-masterpassword').hide();
			$('#auth-yes').hide();
			$('#unlocked').hide();

			$('#btn-authenticate').on("click", function() {
				let password = (<HTMLInputElement>document.getElementById("master-password-input")).value;
        		if (password)
          			self.m_Messenger.PostMessage({MasterPassword: password});
			});
			$('#change-masterpassword-link').on("click", function() {
				if (self.m_isAuthenticated) 
				{
					$('#data-table').fadeOut(1500, function() {
						$('#change-masterpassword').show();
					});
				}
				else 
				{
					$('#error-messages').text("Please authenticate first!");
					$('#error-messages').show();	
				}
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
		this.m_isAuthenticated = true;
		$('#error-messages').hide();
		$('#locked').hide();
		$('#unlocked').show();
		$('#authentication').fadeOut(1500, function() {
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


