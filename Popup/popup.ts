/// <reference path="../Include/index.d.ts"/>
/// <reference path="../Include/index2.d.ts"/>


//ADD MORE STATES, CHANGE STATES IN FUNCTIONS IN OPTIONS TOO.
enum States {
    ST_NONE,
    ST_MASTERSETUP,
    ST_INFOSETUP,
    ST_SETUPAUTH,
    ST_AUTH
}

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
         $("#set-master-password").show();
      }
      else if (msg.Error)
      {
        self.m_Manager.SetError(msg.Error);
      }
      else if (msg.Success)
      {
        self.m_Manager.SetSuccess(msg.Success);
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
  private m_State:number
  constructor() {
    this.m_Messenger = new ClientMessenger(this);
    this.InitListeners();
    this.m_State = States.ST_MASTERSETUP;
  }
  InitListeners():void {
    let self = this;
    $(window).on("load", function() {
      $("#post-info").on("click", function() {
        let username = $("#username-input").val();
        let password = $("#password-input").val();

        if (username && password)
          self.m_Messenger.PostMessage({NewUserInfo: {Username: username, 
                                                      Password: password, 
                                                      MasterPassword: self.m_Password}});
          self.m_Password = "";
      });
      $("#b-setup").on("click", function() {
        self.m_Password = $("#master-password-input").val();
        $("#new-credentials").show();
        $("#master-password").hide();
        self.m_State = States.ST_INFOSETUP;
      });  
      $("#b-login").on("click", function() {
        let password = $("#master-password-input").val();
         if (password)
           self.m_Messenger.PostMessage({MasterPassword: password});
      });
      $(document).keyup(function(event) {
            if (event.keyCode == 13) {
                if (self.m_State === States.ST_MASTERSETUP)
                    $("#post-set-master-password").click();
                else if (self.m_State === States.ST_INFOSETUP)
                    $("#post-info").click();
                else if (self.m_State === States.ST_SETUPAUTH)
                    $("#b-setup").click();
                else if (self.m_State === States.ST_AUTH)
                    $("#b-login").click();
            }
      });
      $("#post-set-master-password").on("click", function() {
        let password = $("#set-master-password-input").val();
        if (password)
        {
          self.m_Messenger.PostMessage({MasterPasswordSetup : password});
          $("#set-master-password").fadeOut(500, function() {
              self.SetLayout(false);
              self.m_State = States.ST_INFOSETUP;
          });
        }
      });
    });
  }
  SetNoFormFound()
  {
      $('#error-message').text("No Form found.");
      $('#error-messages').show();
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
  SetLayout(doesExist:boolean):void {
      $('#master-password').show();
      doesExist ? $("#b-login").show() : $('#b-login').hide();
      doesExist ? $("#b-setup").hide() : $('#b-setup').show();

      let message:string = "";
      if (doesExist)
      {
          this.m_State = States.ST_AUTH;
          message = "Please enter your MasterPassword to log in.";
      }
      else
      {
          this.m_State = States.ST_SETUPAUTH;
          message = "Please enter your MasterPassword to set up your data.";
      }

      $("#master-password-message").text(message);
  }
}
var manager = new PopupManager();

