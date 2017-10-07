/// <reference path="../Include/index.d.ts"/>
/// <reference path="cryptor.ts"/>
/// <reference path="model.ts" />
var ServerMessenger = /** @class */ (function () {
    function ServerMessenger() {
        this.m_Model = new Model();
        this.m_Cryptor = new Cryptor();
        this.m_isFound = false;
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
                if (!self.m_isFound) {
                    self.m_Port["popup"].postMessage({ NoFormFound: "placeholder" });
                    return;
                }
                self.m_Model.GetMainData(function (dataset) {
                    self.m_Cryptor.SetSaltAndIv(dataset.MainData.Salt, dataset.MainData.Iv);
                    if (self.m_Domain) {
                        self.m_Model.GetUserData(self.m_Domain, function (dataset) {
                            self.m_Port["popup"].postMessage({ DomainExists: { val: true } });
                        }, function () {
                            self.m_Port["popup"].postMessage({ DomainExists: { val: false } });
                        });
                    }
                }, function () {
                    self.m_Port["popup"].postMessage({ isNotSetup: "placeholder" });
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
                self.Authenticate(msg.MasterPassword, function (isAuthenticated, dataset) {
                    if (isAuthenticated) {
                        self.m_Cryptor.SetSaltAndIv(dataset.MainData.Salt, dataset.MainData.Iv);
                        self.m_Port["options"].postMessage({ Authenticated: { val: true } });
                        self.m_Model.GetGeneralSettings(function (dataset2) {
                            self.m_Port["options"].postMessage({ Frequency: dataset2.GeneralSettings.Frequency });
                            self.GetDecryptedUserData(msg.MasterPassword, function (dataset3) {
                                if (dataset3)
                                    self.m_Port["options"].postMessage({ UserData: dataset3 });
                                else
                                    self.m_Port["options"].postMessage({ Error: "Could not load or decrypt UserData" });
                            });
                        }, function () {
                            self.m_Port["options"].postMessage({ Error: "Could not retrieve Frequency, default value (0) will be used to calculate remaining." });
                        });
                    }
                    else {
                        self.m_Port["options"].postMessage({ Authenticated: { val: false } });
                    }
                });
            }
            else if (msg.ChangeMasterPassword) {
                var old_pw_1 = msg.ChangeMasterPassword.OldPassword;
                var new_pw_1 = msg.ChangeMasterPassword.NewPassword;
                var error_msg_1 = "";
                var error_domain_1 = "";
                self.Authenticate(old_pw_1, function (isAuthenticated, dataset) {
                    if (isAuthenticated) {
                        var salt_old_1 = dataset.MainData.Salt;
                        var iv_old_1 = dataset.MainData.Iv;
                        var cnt = 0;
                        self.m_Cryptor.MainSetup(new_pw_1, function (hashed_pw, salt_new, iv_new) {
                            self.m_Model.GetAllUserData(function (dataset_UserData) {
                                if (!dataset_UserData) {
                                    self.m_Port["options"].postMessage({ Error: "Unable to retrieve all UserData" });
                                    return;
                                }
                                var _loop_1 = function (domain) {
                                    self.m_Cryptor.SetSaltAndIv(salt_old_1, iv_old_1);
                                    self.m_Cryptor.Decrypt(old_pw_1, dataset_UserData[domain]);
                                    if (dataset_UserData[domain].Username.length == 0 || dataset_UserData[domain].Password.length == 0) {
                                        error_msg_1 = "Error during Decryption";
                                        error_domain_1 = domain;
                                        return "break";
                                    }
                                    self.m_Cryptor.SetSaltAndIv(salt_new, iv_new);
                                    self.m_Cryptor.Encrypt(new_pw_1, dataset_UserData[domain]);
                                    if (dataset_UserData[domain].Username.length == 0 || dataset_UserData[domain].Password.length == 0) {
                                        error_msg_1 = "Error during Encryption";
                                        error_domain_1 = domain;
                                        return "break";
                                    }
                                    self.m_Model.SaveUserData(domain, dataset_UserData[domain].Username, dataset_UserData[domain].Password, dataset_UserData[domain].LastChanged, function () {
                                    }, function () {
                                        error_msg_1 = "Error during SaveUserData";
                                        error_domain_1 = domain;
                                    });
                                    if (error_msg_1.length != 0)
                                        return "break";
                                };
                                for (var domain in dataset_UserData) {
                                    var state_1 = _loop_1(domain);
                                    if (state_1 === "break")
                                        break;
                                }
                                if (error_msg_1.length == 0) {
                                    self.m_Model.SaveMainData(hashed_pw, salt_new, iv_new, function () {
                                        self.m_Port["options"].postMessage({ Success: "Changed Master-Password" });
                                    }, function () {
                                        self.m_Port["options"].postMessage({ Error: "Could not save MainData. Everything is probably broken now." });
                                    });
                                }
                                else {
                                    self.RevertToOldState(dataset_UserData, error_domain_1, old_pw_1, new_pw_1, salt_old_1, iv_old_1, salt_new, iv_new);
                                    self.m_Port["options"].postMessage({ Error: error_msg_1 });
                                }
                            }, function () {
                            });
                        });
                    }
                    else {
                        self.m_Port["options"].postMessage({ Error: "Wrong Master-Password" });
                    }
                });
            }
            else if (msg.ChangeUserData) {
                var date = new Date();
                var domain_1 = msg.ChangeUserData.Domain;
                var masterpassword = msg.ChangeUserData.MasterPassword;
                var id_1 = msg.ChangeUserData.Id;
                self.m_Cryptor.Encrypt(masterpassword, msg.ChangeUserData);
                if (msg.ChangeUserData.Username.length == 0 || msg.ChangeUserData.Password == 0) {
                    self.m_Port["options"].postMessage({ Error: "Could not encrypt UserData" });
                    return;
                }
                self.m_Model.SaveUserData(domain_1, msg.ChangeUserData.Username, msg.ChangeUserData.Password, date.getTime(), function () {
                    self.m_Port["options"].postMessage({ Success: "Data for " + domain_1 + " has been changed" });
                    self.m_Port["options"].postMessage({ ResetInput: { val: id_1 } });
                }, function () {
                    self.m_Port["options"].postMessage({ Error: "Could save UserData" });
                });
            }
            else if (msg.GenerateRandom) {
                var id_element = msg.GenerateRandom.id;
                var random = self.m_Cryptor.GenerateRandom();
                var type_element = msg.GenerateRandom.type;
                self.m_Port["options"].postMessage({ GenerateRandom: { val: random, id: id_element, type: type_element } });
            }
            else if (msg.GeneralSettings) {
                self.m_Model.SaveGeneralSettings(msg.GeneralSettings.Frequency, function () { }, function () {
                    self.m_Port["options"].postMessage({ Error: "Could not save Generalsettings" });
                    return;
                });
                self.GetDecryptedUserData(msg.GeneralSettings.MasterPassword, function (dataset) {
                    if (dataset)
                        self.m_Port["options"].postMessage({ UpdatedUserData: dataset });
                    else
                        self.m_Port["options"].postMessage({ Error: "Could not decrypt updated Userdata" });
                });
            }
            else if (msg.CreateBackup) {
                self.m_Model.GetAllUserData(function (dataset_UserData) {
                    self.m_Model.GetMainData(function (dataset_MainData) {
                        self.m_Model.GetGeneralSettings(function (dataset_GeneralSettings) {
                            var dataset = Object.assign({}, dataset_UserData, dataset_MainData, dataset_GeneralSettings);
                            self.CreateBackup(JSON.stringify(dataset), function (err_msg) {
                                self.m_Port["options"].postMessage({ Error: err_msg });
                            });
                        }, function () {
                            self.m_Port["options"].postMessage({ Error: "Unable to retrieve GeneralSettings" });
                            return;
                        });
                    }, function () {
                        self.m_Port["options"].postMessage({ Error: "Unable to retrieve MainData" });
                        return;
                    });
                }, function () {
                    self.m_Port["options"].postMessage({ Error: "Unable to retrieve all UserData" });
                    return;
                });
            }
            else if (msg.LoadBackup) {
                try {
                    var error_msg_2 = "";
                    var dataset = JSON.parse(msg.LoadBackup);
                    for (var obj in dataset) {
                        if (obj == "MainData")
                            self.m_Model.SaveMainData(dataset[obj].Hash, dataset[obj].Salt, dataset[obj].Iv, function () { }, function () {
                                error_msg_2 = "Unable to save backup data";
                            });
                        else if (obj == "GeneralSettings")
                            self.m_Model.SaveGeneralSettings(dataset[obj].Frequency, function () { }, function () {
                                error_msg_2 = "Unable to save backup data";
                            });
                        else
                            self.m_Model.SaveUserData(obj, dataset[obj].Username, dataset[obj].Password, dataset[obj].LastChanged, function () { }, function () {
                                error_msg_2 = "Unable to save backup data";
                            });
                    }
                    if (error_msg_2) {
                        self.m_Port["options"].postMessage({ Error: "Could not load Backup" });
                        //deleting MainData so cant login and maybe see corrupted data
                        chrome.storage.local.remove("MainData");
                    }
                    else {
                        self.m_Port["options"].postMessage({ Success: "Backup loaded" });
                    }
                }
                catch (e) {
                    self.m_Port["options"].postMessage({ Error: "Corrupted JSON " + e });
                }
            }
            else if (msg.DeleteRecord) {
                self.m_Model.DeleteRecord(msg.DeleteRecord, function () {
                    self.m_Port["options"].postMessage({ Success: "Record deleted" });
                }, function () {
                    self.m_Port["options"].postMessage({ Error: "Could not delete record" });
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
            else if (msg.FormFound) {
                self.m_isFound = msg.FormFound.val;
            }
        });
    };
    ServerMessenger.prototype.InitPopupListener = function (port) {
        var self = this;
        var date = new Date();
        port.onMessage.addListener(function (msg) {
            if (msg.NewUserInfo && self.m_Domain) {
                self.m_Port["filler"].postMessage({ Userdata: msg.NewUserInfo });
                var user = { Username: msg.NewUserInfo.Username, Password: msg.NewUserInfo.Password };
                self.m_Cryptor.Encrypt(msg.NewUserInfo.MasterPassword, user);
                if (user.Username.length == 0 || user.Password.length == 0) {
                    self.m_Port["popup"].postMessage({ Error: "Could not encrypt new UserData" });
                    return;
                }
                self.m_Model.SaveUserData(self.m_Domain, user.Username, user.Password, date.getTime(), function () {
                    self.m_Port["popup"].postMessage({ Success: "Data saved" });
                }, function () {
                    self.m_Port["popup"].postMessage({ Error: "Could not save Data" });
                });
            }
            else if (msg.MasterPasswordSetup) {
                self.m_Model.GetMainData(function (isSetup) {
                }, function () {
                    self.m_Cryptor.MainSetup(msg.MasterPasswordSetup, function (hashed_pw, salt, iv) {
                        self.m_Model.SaveMainData(hashed_pw, salt, iv, function () {
                            self.m_Port["popup"].postMessage({ Success: "Saved MasterPassword" });
                        }, function () {
                            self.m_Port["popup"].postMessage({ Error: "Could not save MasterPassword" });
                        });
                    });
                    self.m_Model.SaveGeneralSettings(30, function () { }, function () { });
                });
            }
            else if (msg.MasterPassword) {
                self.Authenticate(msg.MasterPassword, function (isAuthenticated) {
                    if (isAuthenticated)
                        self.m_Model.GetUserData(self.m_Domain, function (dataset_UserData) {
                            self.m_Cryptor.Decrypt(msg.MasterPassword, dataset_UserData);
                            if (dataset_UserData.Username.length === 0 || dataset_UserData.Password.length === 0)
                                self.m_Port["popup"].postMessage({ Error: "Could not decrypt data." });
                            else
                                self.m_Port["filler"].postMessage({ Userdata: dataset_UserData });
                        }, function () {
                            self.m_Port["popup"].postMessage({ Error: "Could not retrieve UserData" });
                            return;
                        });
                    else
                        self.m_Port["popup"].postMessage({ Error: "Wrong Master Password" });
                });
            }
        });
    };
    ServerMessenger.prototype.Authenticate = function (Master_Password, callback) {
        var hashed_pw = this.m_Cryptor.Hash(Master_Password);
        var self = this;
        this.m_Model.GetMainData(function (dataset) {
            if (dataset.MainData.Hash == hashed_pw) {
                self.m_Cryptor.SetSaltAndIv(dataset.MainData.Salt, dataset.MainData.Iv);
                callback(true, dataset);
            }
            else {
                callback(false, dataset);
            }
        }, function () {
            console.log("Error while trying to retrieve MainData");
        });
    };
    ServerMessenger.prototype.GetDecryptedUserData = function (Master_Password, callback) {
        var self = this;
        this.m_Model.GetAllUserData(function (dataset) {
            for (var obj in dataset) {
                self.m_Cryptor.Decrypt(Master_Password, dataset[obj]);
                if (dataset[obj].Username.length == 0 || dataset[obj].Password.length == 0) {
                    callback(null);
                    return;
                }
            }
            callback(dataset);
        }, function () {
            callback(null);
            return;
        });
    };
    ServerMessenger.prototype.RevertToOldState = function (dataset, domain, old_pw, new_pw, salt_old, iv_old, salt_new, iv_new) {
        var self = this;
        for (var obj in dataset) {
            if (domain == obj)
                break;
            this.m_Cryptor.SetSaltAndIv(salt_new, iv_new);
            this.m_Cryptor.Decrypt(new_pw, dataset[obj]);
            this.m_Cryptor.SetSaltAndIv(salt_old, iv_old);
            this.m_Cryptor.Encrypt(old_pw, dataset[obj]);
            this.m_Model.SaveUserData(obj, dataset[obj].Username, dataset[obj].Password, dataset[obj].LastChanged, function () { }, function () {
                self.m_Port["options"].postMessage({ Error: "Everything is fucked up now" });
            });
        }
    };
    ServerMessenger.prototype.CreateBackup = function (data, callback) {
        var self = this;
        window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
        window.requestFileSystem(window.TEMPORARY, 1024 * 1024, function (fs) {
            fs.root.getFile('backup.txt', { create: true }, function (fileEntry) {
                fileEntry.createWriter(function (fileWriter) {
                    fileWriter.onwriteend = function (e) {
                        chrome.downloads.download({
                            url: fileEntry.toURL()
                        });
                    };
                    fileWriter.onerror = function (e) {
                        callback(e.toString());
                    };
                    var blob = new Blob([data], { type: 'text/plain' });
                    fileWriter.write(blob);
                }, function (e) {
                    callback(e.toString());
                });
            }, function (e) {
                callback(e.toString());
            });
        }, function (e) {
            callback(e.toString());
        });
    };
    return ServerMessenger;
}());
var messenger = new ServerMessenger();
