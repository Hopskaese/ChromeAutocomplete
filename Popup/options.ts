/// <reference path="../Include/index.d.ts"/>
/// <reference path="../Include/index2.d.ts"/>

enum States {
	ST_NONE,
	ST_LOGIN,
	ST_CHANGEPW,
	ST_GENERALSETTINGS,
	ST_MAINPAGE,
	ST_BACKUP
}

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
    	else if (msg.UpdatedUserData)
    	{
    		self.m_Manager.SetSuccess("Generalsettings updated");
    		self.m_Manager.SetupUserData(msg.UpdatedUserData);
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
	private m_State :States;
	private m_StateElements: object;
	constructor() {
		this.m_Messenger = new OptionsMessenger(this);
		this.InitListeners();
		this.m_isAuthenticated = false;
		this.m_Password = "";
		this.m_Frequency = 0;
		this.m_State = States.ST_LOGIN;
		this.m_StateElements = {};
	}
	InitListeners():void {
		let self = this;
		$(document).ready(function() {	
			self.m_StateElements[States.ST_MAINPAGE] = $("#data-table").add('.data-table-row');
			self.m_StateElements[States.ST_GENERALSETTINGS] = $("#general-settings");
			self.m_StateElements[States.ST_CHANGEPW] = $("#change-masterpassword");
			self.m_StateElements[States.ST_BACKUP] = $("#backup");
			self.m_StateElements[States.ST_LOGIN] = $("#authentication");

			$('#btn-authenticate').on("click", function() {
				let password = $("#master-password-input").val();
				self.m_Password = password;
        		if (password)
          			self.m_Messenger.PostMessage({MasterPassword: password});
			});
			$('#btn-save-generalsettings').on("click", function() {
				let frequency = $('#frequency-select').val();
				if (frequency)
				{
					self.SetFrequency(frequency);
					$("#data-table-body").empty();
					self.m_Messenger.PostMessage({GeneralSettings : {Frequency :frequency, MasterPassword: self.m_Password}});
				}
				else
				{
					self.SetError("Can obtain val from select element");
				}
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
			$("#btn-home").on("click", function() {
				if (self.m_isAuthenticated)
				{
					self.SetPageToState(States.ST_MAINPAGE);
					self.SetState(States.ST_MAINPAGE);
				}
				else
				{
					self.SetPageToState(States.ST_LOGIN);
					self.SetState(States.ST_LOGIN);
				}
			});
			$('#change-masterpassword-link').on("click", function() {
				self.SetPageToState(States.ST_CHANGEPW);
				self.SetState(States.ST_CHANGEPW);
			});
			$('#general-settings-link').on("click", function() {
				if (!self.m_isAuthenticated)
				{
					self.SetError("You have to be logged in to change general settings!");
					return;
				}
				
				self.SetPageToState(States.ST_GENERALSETTINGS);
				self.SetState(States.ST_GENERALSETTINGS);
			});
			$('#download-backup-link').on("click", function() {
				self.SetPageToState(States.ST_BACKUP);
				self.SetState(States.ST_BACKUP);
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
					if (self.m_State === States.ST_LOGIN)
						$("#btn-authenticate").click();
					else if (self.m_State === States.ST_CHANGEPW)
						$("#btn-change").click();
					else if (self.m_State === States.ST_GENERALSETTINGS)
						$("#btn-save-generalsettings").click();
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
	SetState(state:States):void {
		this.m_State = state;
	}
	SetupAuthenticated():void {
		$('#locked').hide();
		$('#unlocked').show();
		$('#auth-no').hide();
		$('#auth-yes').show();
		this.SetPageToState(States.ST_MAINPAGE);
		this.SetState(States.ST_MAINPAGE);
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
	SetPageToState(state): void {
		if (this.m_State == state)
			return;

		let self = this;
		this.m_StateElements[this.m_State].fadeOut(2000, function() {
			self.m_StateElements[state].show();
		});
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
			else if (time_left / 7 > 1)
				time_string = ""+Math.floor(time_left/7)+" weeks and "+Math.floor(time_left % 7)+" days";
			else
				time_string = ""+Math.floor(time_left)+" days";

			$('#data-table-body').append('<tr class="data-table-row">\
      						   <th scope="row">'+cnt+'</th>\
      						   <td id="td-domain'+cnt+'">'+obj+'</td>\
                     <td id="td-username'+cnt+'">'+dataset[obj].Username+'</td>\
                     <td id="td-password'+cnt+'">'+dataset[obj].Password+'</td>\
                     <td id="td-button'+cnt+'"><button type="button" class="btn btn-sm btn-primary" id="change'+cnt+'">Change</button></td>\
                     <td id="td-deadline'+cnt+'">'+time_string+'</td>\
                     </tr>');

			if (time_left < 0)
				$('#td-deadline'+cnt).css("color", "#ff0000");

			cnt++;
		}
	}
}

var manager = new OptionsManager();

