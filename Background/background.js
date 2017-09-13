/// <reference path="../Include/index.d.ts"/>
/// <reference path="cryptor.ts"/>
///  <reference path="model.ts" />
var ServerMessenger = (function () {
    function ServerMessenger() {
        this.m_Model = new Model();
        this.m_Cryptor = new Cryptor();
        this.m_Port = {};
        this.InitListeners();
    }
    ServerMessenger.prototype.InitListeners = function () {
        var self = this;
        chrome.runtime.onConnect.addListener(function (port) {
            self.m_Port[port.name] = port;
            if (port.name == "filler") {
                console.log("filler connected");
                self.InitFillerListener(port);
            }
            else if (port.name == "popup") {
                console.log("popup connected");
                self.InitPopupListener(port);
                self.m_Model.GetMainData(function (dataset) {
                    if (dataset == null) {
                        self.m_Port["popup"].postMessage({ isNotSetup: "placeholder" });
                    }
                    else {
                        self.m_Cryptor.SetSaltAndIv(dataset.MainData.Salt, dataset.MainData.Iv);
                        var doesExist_1 = false;
                        if (self.m_Domain) {
                            self.m_Model.GetUserData(self.m_Domain, function (dataset) {
                                if (dataset)
                                    doesExist_1 = true;
                                self.m_Port["popup"].postMessage({ DomainExists: { val: doesExist_1 } });
                            });
                        }
                    }
                });
            }
            else if (port.name == "options") {
                console.log("options connected");
                self.InitOptionsListener(port);
            }
        });
    };
    ServerMessenger.prototype.InitOptionsListener = function (port) {
        var self = this;
        port.onMessage.addListener(function (msg) {
            if (msg.MasterPassword) {
                var hashed_pw_1 = self.m_Cryptor.Hash(msg.MasterPassword);
                self.m_Model.GetMainData(function (dataset) {
                    if (dataset.MainData.Hash == hashed_pw_1) {
                        self.m_Cryptor.SetSaltAndIv(dataset.MainData.Salt, dataset.MainData.Iv);
                        self.m_Port["options"].postMessage({ Authenticated: { val: true } });
                        self.m_Model.GetAllUserData(function (dataset) {
                            for (var obj in dataset)
                                self.m_Cryptor.Decrypt(msg.MasterPassword, dataset[obj]);
                            self.m_Port["options"].postMessage({ UserData: dataset });
                        });
                    }
                    else {
                        self.m_Port["options"].postMessage({ Authenticated: { val: false } });
                    }
                });
            }
            else if (msg.ChangeMasterPassword) {
                var old_pw_1 = msg.ChangeMasterPassword.OldPassword;
                var hashed_old_1 = self.m_Cryptor.Hash(old_pw_1);
                var new_pw_1 = msg.ChangeMasterPassword.NewPassword;
                self.m_Model.GetMainData(function (dataset) {
                    if (dataset.MainData.Hash === hashed_old_1) {
                        var salt_old_1 = dataset.MainData.Salt;
                        var iv_old_1 = dataset.MainData.Iv;
                        self.m_Cryptor.MainSetup(new_pw_1, function (hashed_pw, salt, iv) {
                            self.m_Model.SaveMainData(hashed_pw, salt, iv);
                            self.m_Model.GetAllUserData(function (dataset) {
                                for (var obj in dataset) {
                                    self.m_Cryptor.SetSaltAndIv(salt_old_1, iv_old_1);
                                    self.m_Cryptor.Decrypt(old_pw_1, dataset[obj]);
                                    self.m_Cryptor.SetSaltAndIv(salt, iv);
                                    self.m_Cryptor.Encrypt(new_pw_1, dataset[obj]);
                                    self.m_Model.SaveUserData(obj, dataset[obj].Username, dataset[obj].Password);
                                }
                            });
                        });
                    }
                    else {
                        self.m_Port["options"].postMessage({ Error: "Wrong Master-Password" });
                    }
                });
            }
        });
    };
    ServerMessenger.prototype.InitFillerListener = function (port) {
        var self = this;
        port.onMessage.addListener(function (msg) {
            if (msg.Domain) {
                self.m_Domain = msg.Domain;
            }
        });
    };
    ServerMessenger.prototype.InitPopupListener = function (port) {
        var self = this;
        port.onMessage.addListener(function (msg) {
            if (msg.NewUserInfo && self.m_Domain) {
                self.m_Port["filler"].postMessage({ Userdata: msg.NewUserInfo });
                var user = { Username: msg.NewUserInfo.Username, Password: msg.NewUserInfo.Password };
                self.m_Cryptor.Encrypt(msg.NewUserInfo.MasterPassword, user);
                self.m_Model.SaveUserData(self.m_Domain, user.Username, user.Password);
            }
            else if (msg.MasterPasswordSetup) {
                self.m_Model.GetMainData(function (isSetup) {
                    if (isSetup == null)
                        self.m_Cryptor.MainSetup(msg.MasterPasswordSetup, self.m_Model.SaveMainData);
                });
            }
            else if (msg.MasterPassword) {
                var hashed_pw_2 = self.m_Cryptor.Hash(msg.MasterPassword);
                self.m_Model.GetMainData(function (dataset) {
                    if (dataset.MainData.Hash == hashed_pw_2)
                        self.m_Model.GetUserData(self.m_Domain, function (dataset) {
                            self.m_Cryptor.Decrypt(msg.MasterPassword, dataset);
                            if (dataset.Username.length === 0 || dataset.Password.length === 0)
                                self.m_Port["popup"].postMessage({ Error: "Could not decrypt data." });
                            else
                                self.m_Port["filler"].postMessage({ Userdata: dataset });
                        });
                    else
                        self.m_Port["popup"].postMessage({ Error: "Wrong Master Password" });
                });
            }
        });
    };
    return ServerMessenger;
}());
var messenger = new ServerMessenger();
