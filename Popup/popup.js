/// <reference path="../Include/index.d.ts"/>
/// <reference path="../Include/index2.d.ts"/>
//ADD MORE STATES, CHANGE STATES IN FUNCTIONS IN OPTIONS TOO.
var States;
(function (States) {
    States[States["ST_NONE"] = 0] = "ST_NONE";
    States[States["ST_MASTERSETUP"] = 1] = "ST_MASTERSETUP";
    States[States["ST_INFOSETUP"] = 2] = "ST_INFOSETUP";
    States[States["ST_SETUPAUTH"] = 3] = "ST_SETUPAUTH";
    States[States["ST_AUTH"] = 4] = "ST_AUTH";
})(States || (States = {}));
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
            else if (msg.Success) {
                self.m_Manager.SetSuccess(msg.Success);
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
        this.m_State = States.ST_MASTERSETUP;
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
                self.m_State = States.ST_INFOSETUP;
            });
            $("#b-login").on("click", function () {
                var password = $("#master-password-input").val();
                if (password)
                    self.m_Messenger.PostMessage({ MasterPassword: password });
            });
            $(document).keyup(function (event) {
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
            $("#post-set-master-password").on("click", function () {
                var password = $("#set-master-password-input").val();
                if (password) {
                    self.m_Messenger.PostMessage({ MasterPasswordSetup: password });
                    $("#set-master-password").fadeOut(500, function () {
                        self.SetLayout(false);
                        self.m_State = States.ST_INFOSETUP;
                    });
                }
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
        doesExist ? $("#b-login").show() : $('#b-login').hide();
        doesExist ? $("#b-setup").hide() : $('#b-setup').show();
        var message = "";
        if (doesExist) {
            this.m_State = States.ST_AUTH;
            message = "Please enter your MasterPassword to log in.";
        }
        else {
            this.m_State = States.ST_SETUPAUTH;
            message = "Please enter your MasterPassword to set up your data.";
        }
        $("#master-password-message").text(message);
    };
    return PopupManager;
}());
var manager = new PopupManager();
