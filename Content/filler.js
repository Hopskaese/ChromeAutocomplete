// content-script which is injected into site
/*
port.onDisconnect.addListener((p) => {
  if (p.error) {
    console.log(`Disconnected due to an error: ${p.error.message}`);
  }
});
*/
/// <reference path="../Include/index.d.ts"/>
var ClientMessenger = (function () {
    function ClientMessenger() {
        this.m_Filler = new Filler();
        this.m_Filler.InitFormObject();
        this.InitListeners();
    }
    ClientMessenger.prototype.InitListeners = function () {
        var self = this;
        this.m_Port = chrome.runtime.connect({ name: "filler" });
        this.m_Port.onMessage.addListener(function (msg, sender) {
            if (msg.Userdata)
                self.m_Filler.FillInInfo(msg.Userdata[document.domain].Username, msg.Userdata[document.domain].Password);
        });
        this.PostMessage({ Domain: document.domain });
    };
    ClientMessenger.prototype.PostMessage = function (input) {
        this.m_Port.postMessage(input);
    };
    return ClientMessenger;
}());
var Filler = (function () {
    function Filler() {
    }
    Filler.prototype.InitFormObject = function () {
        var forms = document.forms;
        for (var i = 0; i < forms.length; i++) {
            var input_user = forms[i].querySelector('input[type="text"]');
            var input_email = forms[i].querySelector('input[type="email"]');
            var input_pw = forms[i].querySelector('input[type="password"]');
            if (input_user != null || input_email != null && input_pw != null) {
                this.m_Form = forms[i];
                this.m_FormObject = new Array();
                this.m_FormObject["username"] = input_user || input_email;
                this.m_FormObject["password"] = input_pw;
                break;
            }
        }
    };
    Filler.prototype.FillInInfo = function (username, password) {
        this.m_FormObject["username"].value = username;
        this.m_FormObject["password"].value = password;
    };
    return Filler;
}());
var messenger = new ClientMessenger();
