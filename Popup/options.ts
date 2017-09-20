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
    			self.m_Manager.SetAuthenticated();
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
    	else if (msg.Success)
    	{
    		self.m_Manager.SetSuccess(msg.Success);
    	}
    	else if (msg.ResetInput)
    	{
    		self.m_Manager.ChangeTextInputToTd(msg.ResetInput.val);
    	}
    	else if (msg.GenerateRandom)
    	{
    		self.m_Manager.SetTextInputValue(msg.GenerateRandom.id, msg.GenerateRandom.type, msg.GenerateRandom.val);
    	}
    	else if (msg.Frequency)
    	{
    		self.m_Manager.SetFrequency(msg.Frequency);
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
	private m_Password :string;
	private m_Frequency :number;
	constructor() {
		this.m_Messenger = new OptionsMessenger(this);
		this.InitListeners();
		this.m_isAuthenticated = false;
		this.m_Password = "";
		this.m_Frequency = 0;
	}
	InitListeners():void {
		let self = this;
		$(document).ready(function() {
			$('#btn-authenticate').on("click", function() {
				let password = $("#master-password-input").val();
				self.m_Password = password;
        		if (password)
          			self.m_Messenger.PostMessage({MasterPassword: password});
			});
			$('#btn-save-generalsettings').on("click", function() {
				let frequency = $('#frequency-select').val();
				if (frequency)
					self.m_Messenger.PostMessage({GeneralSettings : frequency});
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
				if($('#general-settings').is(':visible'))
					$('#general-settings').hide();

				self.m_isAuthenticated ? 
					$('#data-table').add('.data-table-row').fadeOut(1500, function() {$('#change-masterpassword').show();}) :
					$('#authentication').fadeOut(1500, function() {$('#change-masterpassword').show();}) 
			});
			$('#general-settings-link').on("click", function() {
				if (!self.m_isAuthenticated)
				{
					self.SetError("You have to be logged in to change general settings!");
					return;
				}
				if ($('#change-masterpassword').is(':visible'))
					$('#change-masterpassword').hide();

				$('#data-table').add('.data-table-row').fadeOut(1500, function() {$('#general-settings').show();});
			});
			$('#data-table').on("click",'[id^=change]', function() {
				let id:string = $(this).attr("id");
				id = id.substr(6, id.length);
				$(this).hide();
				self.ChangeTdToTextInput(id);
			});
			$('#data-table').on("click", '[id^=save]', function() {
				let id:string = $(this).attr("id");
				id = id.substr(4, id.length);
				let new_username = $('#td-input-username'+id).val();
				let new_password = $('#td-input-password'+id).val();
				let domain 		 = $('#td-domain'+id).text();

				if (new_username.length > 0 && new_password.length > 0)
					self.m_Messenger.PostMessage({ChangeUserData: {Domain: domain, 
																   Username: new_username, 
																   Password: new_password, 
																   MasterPassword: self.m_Password,
																   Id: id}});
				else
					self.SetError("Input fields cant be empty!");
			});
			$('#data-table').on("click", '[id^=generate-username]', function() {
				let id_element:string = $(this).attr("id");
				id_element = id_element.substr(17, id_element.length);

				self.m_Messenger.PostMessage({GenerateRandom: {id: id_element, type: "username"}});
			});
			$('#data-table').on("click", '[id^=generate-password]', function() {
				let id_element:string = $(this).attr("id");
				id_element = id_element.substr(17, id_element.length);

				self.m_Messenger.PostMessage({GenerateRandom: {id: id_element, type: "password"}});
			});
			$(document).keyup(function(event) {
				if (event.keyCode == 13) {
					$("#btn-authenticate").click();
				}
			});
		});
	}
	ChangeTdToTextInput(id:string):void {
		let td_username = $('#td-username'+id);
		let td_password = $('#td-password'+id);
		let td_button 	= $('#td-button'+id);

		let username:string = td_username.text();
		td_username.text("");
		let password:string = td_password.text();
		td_password.text("");

		if (username.indexOf("@") == -1)
			td_username.append('<button type="button" class="btn btn-sm btn-primary" style="margin-right:2%" id="generate-username'+id+'">Generate</button');
		td_password.append('<button type="button" class="btn btn-sm btn-primary" style="margin-right:2%" id="generate-password'+id+'">Generate</button');

		td_username.append('<input type="text" id="td-input-username'+id+'" value="'+username+'">');
		td_password.append('<input type="text" id="td-input-password'+id+'"value="'+password+'">');
		td_button.append('<button type="button" class="btn btn-sm btn-primary" id="save'+id+'">Save</button');
	}
	ChangeTextInputToTd(id:string):void {
		let input_username = $('#td-input-username'+id);
		let input_password = $('#td-input-password'+id);
		let button_save = $('#save'+id);
		let button_generate_username = $('#generate-username'+id);
		let button_generate_password = $('#generate-password'+id);

		let username = input_username.val();
		let password = input_password.val();

		input_username.remove();
		input_password.remove();
		button_generate_password.remove();
		button_generate_username.remove();
		button_save.remove();

		$('#td-username'+id).text(username);
		$('#td-password'+id).text(password);
		$('#td-button'+id).append('<button type="button" class="btn btn-sm btn-primary" id="change'+id+'">Change</button>');
	}
	SetTextInputValue(id:string, type:string, value:string):void {
		if (type == "username")
			$('#td-input-username'+id).val(value);
		else if (type == "password")
			$('#td-input-password'+id).val(value);
	}
	SetFrequency(frequency:number)
	{
		this.m_Frequency = frequency;
	}
	SetAuthenticated():void {
		this.m_isAuthenticated = true;
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
	SetError(error:string):void {
		$('#error-message').text(error);
		$('#error-messages').show();
		$('#error-messages').fadeOut(3000);
	}
	SetSuccess(success:string):void {
		$('#success-message').text(success);
		$('#success-messages').show();
		$('#success-messages').fadeOut(3000);
	}
	SetupUserData(dataset:any)
	{
		let cnt = 0;
		let date = new Date();
		let time = date.getTime();

		let time_left:number = 0;
		let time_string:string = "";

		for (let obj in dataset) 
		{
			time_left = (time - dataset[obj].LastChanged) / 1000 / 60 / 60 / 24;
			time_left = this.m_Frequency - time_left;
		
			if ((time_left / 30) == 1)
				time_string = "1 Month";
			else if ((time_left / 7 > 1))
				time_string = ""+Math.floor(time_left/7)+" weeks and "+Math.floor(time_left % 7)+" days";
			else
				time_string = ""+Math.floor(time_left)+" days";

			$('tbody').append('<tr class="data-table-row">\
      						   <th scope="row">'+cnt+'</th>\
      						   <td id="td-domain'+cnt+'">'+obj+'</td>\
                               <td id="td-username'+cnt+'">'+dataset[obj].Username+'</td>\
                               <td id="td-password'+cnt+'">'+dataset[obj].Password+'</td>\
                               <td id="td-button'+cnt+'"><button type="button" class="btn btn-sm btn-primary" id="change'+cnt+'">Change</button></td>\
                               <td id="td-deadline'+cnt+'">'+time_string+'</td>\
                               </tr>');

			if (time_left < 0)
				$('#td-deadline').css("border", "#ff0000");

			cnt++;
		}
	}
}

var manager = new OptionsManager();

