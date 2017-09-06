/// <reference path="../Include/index.d.ts"/>

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
    window.addEventListener("load", function() {
      document.getElementById("post-info").addEventListener("click", function() {
        let username = (<HTMLInputElement>document.getElementById("username-input")).value;
        let password = (<HTMLInputElement>document.getElementById("password-input")).value;

        if (username && password)
          self.m_Messenger.PostMessage({NewUserInfo: {Username: username, Password: password, MasterPassword: self.m_Password}});
          self.m_Password = "";
      });
      document.getElementById("b-setup").addEventListener("click", function() {
        self.m_Password = (<HTMLInputElement>document.getElementById("master-password-input")).value;
        self.DisplayElement("new-credentials");
        self.HideElement("master-password");
      });  
      document.getElementById("b-login").addEventListener("click", function() {
        let password = (<HTMLInputElement>document.getElementById("master-password-input")).value;
         if (password)
           self.m_Messenger.PostMessage({MasterPassword: password});
      });
      document.getElementById("post-set-master-password").addEventListener("click", function() {
        let password = (<HTMLInputElement>document.getElementById("set-master-password-input")).value;
        if (password)
          self.m_Messenger.PostMessage({MasterPasswordSetup : password});
      });
    });
  }
  SetLayout(doesExist:boolean):void {
    document.getElementById("set-master-password").style.display = "none";
    document.getElementById("error-messages").style.display = "none";
    document.getElementById("master-password").style.display = "block";
    document.getElementById("b-login").style.display = doesExist ? "block" : "none";
    document.getElementById("b-setup").style.display = doesExist ? "none" : "block";

    let message:string = "";
    if (doesExist)
        message = "Please enter your MasterPassword so we can log you in";
    else
        message = "Please enter your MasterPassword so we can set up your data";

    let header = <HTMLInputElement>document.getElementById("master-password-message");
    header.innerHTML = message;
  }
  DisplayError(message:string):void {
    let element = <HTMLInputElement>document.getElementById("error-messages");
    let paragraph = <HTMLInputElement>document.getElementById("error-message");
    paragraph.innerHTML = message;
    element.style.display = "block";
  }
  DisplayElement(id:string):void {
    document.getElementById(id).style.display = "block";
  }
  HideElement(id:string):void {
    document.getElementById(id).style.display = "none";
  }
}

var manager = new PopupManager();
