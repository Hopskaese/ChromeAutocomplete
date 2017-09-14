/// <reference path="../Include/index.d.ts"/>
/// <reference path="../Include/index2.d.ts"/>

class ClientMessenger {
  m_Port:chrome.runtime.Port;
  m_Manager:PopupManager;
  constructor(manager:PopupManager) {
    this.m_Manager = manager;
    this.InitListeners();
  }
  InitListeners():void {
    this.m_Port = chrome.runtime.connect({name:"popup"});
    let self = this;
    this.m_Port.onMessage.addListener(function(msg:any, sender:chrome.runtime.Port) {
      if (msg.DomainExists)
      {
        self.m_Manager.SetLayout(msg.DomainExists.val);
      }
      else if (msg.NoFormFound)
      {
        self.m_Manager.SetNoFormFound();
      }
      else if (msg.isNotSetup)
      {
         self.m_Manager.DisplayElement("set-master-password");
      }
      else if (msg.Error)
      {
        self.m_Manager.DisplayError(msg.Error);
      }
    });
  } 
  PostMessage(input:object):void {
    this.m_Port.postMessage(input);
  }
}

class PopupManager {
  private m_Messenger:ClientMessenger;
  private m_Password:String;
  constructor() {
    this.m_Messenger = new ClientMessenger(this);
    this.InitListeners();
  }
  InitListeners():void {
    let self = this;
    $(window).on("load", function() {
      $("#post-info").on("click", function() {
        let username = $("#username-input").val();
        let password = $("#password-input").val();

        if (username && password)
          self.m_Messenger.PostMessage({NewUserInfo: {Username: username, Password: password, MasterPassword: self.m_Password}});
          self.m_Password = "";
      });
      $("#b-setup").on("click", function() {
        self.m_Password = $("#master-password-input").val();
        $("#new-credentials").show();
        $("#master-password").hide();
      });  
      $("#b-login").on("click", function() {
        let password = $("#master-password-input").val();
         if (password)
           self.m_Messenger.PostMessage({MasterPassword: password});
      });
      $("#post-set-master-password").on("click", function() {
        let password = $("#set-master-password-input").val();
        if (password)
          self.m_Messenger.PostMessage({MasterPasswordSetup : password});
      });
    });
  }
  SetNoFormFound()
  {
      $('#error-message').text("No Form found.");
      $('#error-messages').show();
  }
  SetLayout(doesExist:boolean):void {
      $('#master-password').show();
        //document.getElementById("b-login").style.display = doesExist ? "block" : "none";
        //document.getElementById("b-setup").style.display = doesExist ? "none" : "block";
      doesExist ? $("#b-login").show() : $('#b-login').hide();
      doesExist ? $("#b-setup").hide() : $('#b-setup').show();

      let message:string = "";
      if (doesExist)
          message = "Please enter your MasterPassword to log in.";
      else
          message = "Please enter your MasterPassword to set up your data.";

      $("#master-password-message").text(message);
  }
  DisplayError(message:string):void {
    $('#error-messages').text(message);
    $('#error-messages').show();
  }
  DisplayElement(id:string):void {
    $('#'+id).show();
  }
  HideElement(id:string):void {
    $('#'+id).hide();
  }
}

var manager = new PopupManager();
