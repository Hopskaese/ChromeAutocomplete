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
        console.log("Domain exists?:"+ msg.DomainExists.val)
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
  constructor() {
    this.m_Messenger = new ClientMessenger(this);
    this.InitListener();
  }
  InitListener():void {
    let self = this;
    window.addEventListener("load", function() {
      document.getElementById("post-login").addEventListener("click", function() {
        let username = (<HTMLInputElement>document.getElementById("username-input")).value;
        let password = (<HTMLInputElement>document.getElementById("password-input")).value;

        if (username && password)
            self.m_Messenger.PostMessage({NewUserInfo: {Username: username, Password: password}});
      });
      document.getElementById("post-master-password").addEventListener("click", function() {
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
    document.getElementById("master-password").style.display = doesExist ? "block" : "none";
    document.getElementById("new-credentials").style.display = doesExist ? "none" : "block";
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
}

var PopupManger = new PopupManager();
