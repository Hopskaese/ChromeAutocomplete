var ClientMessenger = {
  m_Port : null,

  InitListeners: function() {
    m_Port = chrome.runtime.connect({name:"popup"});
    m_Port.onMessage.addListener(function(msg, sender) {
      if (msg.DomainExists)
      {
        let val = msg.DomainExists.val;
        if (val)
        {
          $('#master-password').show();
          $('#new-credentials').hide();
        }
        else
        {
          $('#new-credentials').show();
          $('#master-password').hide();
        }
      }   
    });
  },
  PostMessage: function(json) {
    m_Port.postMessage(json);
  }
}

var PopupManager = {
  InitListeners: function() {  
    $("#post-login").on("click", function() {
      var username = $("#username-input").val();
      var password =  $("#password-input").val();
      if (username && password)
        ClientMessenger.PostMessage({NewUserinfo: {Username: username, Password: password}}); 
    });
    $("#post-master-password").on("click", function() {
      var password = $("#master-password-input").val();
      if (password)
          ClientMessenger.PostMessage({MasterPassword: password});
    });
  }
}

$(document).ready(function() {
    PopupManager.InitListeners();
    ClientMessenger.InitListeners();
});
