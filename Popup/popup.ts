/// <reference path="../include/index.d.ts"/>

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
        let val:boolean = msg.DomainExists.val;
        console.log("Domainexists value:"+msg.DomainExists.val);
        self.m_Manager.SetLayout(val);
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
      // casting to subtype HTMLInputElement to uptain value property.
        let username = (<HTMLInputElement>document.getElementById("username-input")).value;
        let password = (<HTMLInputElement>document.getElementById("password-input")).value;

        if (username && password)
          self.m_Messenger.PostMessage({NewUserinfo: {Username: username, Password: password}});
      });
      document.getElementById("post-master-password").addEventListener("click", function() {
        let password = (<HTMLInputElement>document.getElementById("master-password-input")).value;
         if (password)
           self.m_Messenger.PostMessage({MasterPassword: password});
      });
    });
  }
  SetLayout(doesExist:boolean):void {
    document.getElementById("master-password").style.visibility = doesExist ? "visible" : "hidden";
    document.getElementById("new-credentials").style.visibility = doesExist ? "hidden" : "visible";
  }
}

var PopupManger = new PopupManager();
