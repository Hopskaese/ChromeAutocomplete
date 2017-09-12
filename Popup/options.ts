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
    			self.m_Manager.SetError("Wrong Master-Password!");
    		}
    	}
    	else if (msg.UserData)
    	{
    		self.m_Manager.SetupUserData(msg.UserData);
    	}
    	else if (msg.Error)
    	{
    		self.m_Manager.SetError(msg.Error);
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
			$('#btn-change').on("click", function() {
				let old_pw = $('#password-old-input').val();
				let new_pw = $('#password-new-input').val();
				let new_pw2 = $('#password-new-input2').val();
				if (!old_pw || !new_pw || !new_pw2)
				{
					self.SetError("Please fill in all fields!");
				}
				else if (new_pw != new_pw2)
				{
					self.SetError("New Password inputs don't match!");
				}
				else 
				{
					self.m_Messenger.PostMessage({ChangeMasterPassword: {OldPassword: old_pw, NewPassword: new_pw}});
				}

			});
			$('#change-masterpassword-link').on("click", function() {
				$('#data-table').fadeOut(1500, function() {
					$('#authentication').is(":visible") ? 
					$('#authentication').fadeOut(1500, function() {$('#change-masterpassword').show();}) :
					$('#data-table').fadeOut(1500, function() {$('#change-masterpassword').show();});
					$('#change-masterpassword').show();
				});
			});
			$(document).keyup(function(event) {
				if (event.keyCode == 13) {
					$("#btn-authenticate").click();
				}
			});
		});
	}
	SetError(error:string):void {
		$('#error-messages').text(error);
		$('#error-messages').show();
	}
	SetupAuthenticated():void {
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


