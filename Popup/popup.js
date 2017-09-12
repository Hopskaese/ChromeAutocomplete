/// <reference path="../Include/index.d.ts"/>
/// <reference path="../Include/index2.d.ts"/>
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
        this.InitListeners();
    }
    PopupManager.prototype.InitListeners = function () {
        var self = this;
        $(window).on("load", function () {
            $("#post-info").on("click", function () {
                var username = $("#username-input").val();
                var password = $("#password-input").val();
                if (username && password)
                    self.m_Messenger.PostMessage({ NewUserInfo: { Username: username, Password: password, MasterPassword: self.m_Password } });
                self.m_Password = "";
            });
            $("#b-setup").on("click", function () {
                self.m_Password = $("#master-password-input").val();
                $("#new-credentials").show();
                $("#master-password").hide();
            });
            $("#b-login").on("click", function () {
                var password = $("#master-password-input").val();
                if (password)
                    self.m_Messenger.PostMessage({ MasterPassword: password });
            });
            $("#post-set-master-password").on("click", function () {
                var password = $("#set-master-password-input").val();
                if (password)
                    self.m_Messenger.PostMessage({ MasterPasswordSetup: password });
            });
        });
    };
    PopupManager.prototype.SetLayout = function (doesExist) {
        $("#set-master-password").hide();
        $("#error-messages").hide();
        $("#master-password").show();
        //document.getElementById("b-login").style.display = doesExist ? "block" : "none";
        //document.getElementById("b-setup").style.display = doesExist ? "none" : "block";
        doesExist ? $("#b-login").show() : $('#b-login').hide();
        doesExist ? $("#b-setup").hide() : $('#b-setup').show();
        var message = "";
        if (doesExist)
            message = "Please enter your MasterPassword so we can log you in";
        else
            message = "Please enter your MasterPassword so we can set up your data";
        $("#master-password-message").text(message);
    };
    PopupManager.prototype.DisplayError = function (message) {
        $('#error-messages').text(message);
        $('#error-messages').show();
    };
    PopupManager.prototype.DisplayElement = function (id) {
        $('#' + id).show();
    };
    PopupManager.prototype.HideElement = function (id) {
        $('#' + id).hide();
    };
    return PopupManager;
}());
var manager = new PopupManager();
