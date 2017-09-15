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
            else if (msg.NoFormFound) {
                self.m_Manager.SetNoFormFound();
            }
            else if (msg.isNotSetup) {
                $("#set-master-password").show();
            }
            else if (msg.Error) {
                self.m_Manager.SetError(msg.Error);
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
                    self.m_Messenger.PostMessage({ NewUserInfo: { Username: username,
                            Password: password,
                            MasterPassword: self.m_Password } });
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
    PopupManager.prototype.SetNoFormFound = function () {
        $('#error-message').text("No Form found.");
        $('#error-messages').show();
    };
    PopupManager.prototype.SetError = function (error) {
        $('#error-message').text(error);
        $('#error-messages').show();
        $('#error-messages').fadeOut(3000);
    };
    PopupManager.prototype.SetSuccess = function (success) {
        $('#success-message').text(success);
        $('#success-messages').show();
        $('#success-messages').fadeOut(3000);
    };
    PopupManager.prototype.SetLayout = function (doesExist) {
        $('#master-password').show();
        //document.getElementById("b-login").style.display = doesExist ? "block" : "none";
        //document.getElementById("b-setup").style.display = doesExist ? "none" : "block";
        doesExist ? $("#b-login").show() : $('#b-login').hide();
        doesExist ? $("#b-setup").hide() : $('#b-setup').show();
        var message = "";
        if (doesExist)
            message = "Please enter your MasterPassword to log in.";
        else
            message = "Please enter your MasterPassword to set up your data.";
        $("#master-password-message").text(message);
    };
    return PopupManager;
}());
var manager = new PopupManager();
