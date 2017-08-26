/// <reference path="../Include/index.d.ts"/>
var ClientMessenger = (function () {
    function ClientMessenger(manager) {
        this.m_Manager = manager;
        this.InitListeners();
    }
    ClientMessenger.prototype.InitListeners = function () {
        this.m_Port = chrome.runtime.connect({ name: "popup" });
        var self = this;
        this.m_Port.onMessage.addListener(function (msg, sender) {
            if (msg.DomainExists) {
                console.log("Domain exists?:" + msg.DomainExists.val);
                self.m_Manager.SetLayout(msg.DomainExists.val);
            }
            else if (msg.isNotSetup) {
                self.m_Manager.DisplayElement("set-master-password");
            }
            else if (msg.Error) {
                self.m_Manager.DisplayError(msg.Error);
            }
        });
    };
    ClientMessenger.prototype.PostMessage = function (input) {
        this.m_Port.postMessage(input);
    };
    return ClientMessenger;
}());
var PopupManager = (function () {
    function PopupManager() {
        this.m_Messenger = new ClientMessenger(this);
        this.InitListener();
    }
    PopupManager.prototype.InitListener = function () {
        var self = this;
        window.addEventListener("load", function () {
            document.getElementById("post-login").addEventListener("click", function () {
                var username = document.getElementById("username-input").value;
                var password = document.getElementById("password-input").value;
                if (username && password)
                    self.m_Messenger.PostMessage({ NewUserInfo: { Username: username, Password: password } });
            });
            document.getElementById("post-master-password").addEventListener("click", function () {
                var password = document.getElementById("master-password-input").value;
                if (password)
                    self.m_Messenger.PostMessage({ MasterPassword: password });
            });
            document.getElementById("post-set-master-password").addEventListener("click", function () {
                var password = document.getElementById("set-master-password-input").value;
                if (password)
                    self.m_Messenger.PostMessage({ MasterPasswordSetup: password });
            });
        });
    };
    PopupManager.prototype.SetLayout = function (doesExist) {
        document.getElementById("set-master-password").style.display = "none";
        document.getElementById("error-messages").style.display = "none";
        document.getElementById("master-password").style.display = doesExist ? "block" : "none";
        document.getElementById("new-credentials").style.display = doesExist ? "none" : "block";
    };
    PopupManager.prototype.DisplayError = function (message) {
        var element = document.getElementById("error-messages");
        var paragraph = document.getElementById("error-message");
        paragraph.innerHTML = message;
        element.style.display = "block";
    };
    PopupManager.prototype.DisplayElement = function (id) {
        document.getElementById(id).style.display = "block";
    };
    return PopupManager;
}());
var PopupManger = new PopupManager();
