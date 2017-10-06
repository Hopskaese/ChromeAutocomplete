//chrome.storage.local.get(null, function (data) { console.info(data) });
/// <reference path="../Include/index.d.ts"/>
var Model = (function () {
    function Model() {
        this.m_CurDataset = null;
    }
    Model.prototype.SaveUserData = function (domain, username, password, lastchanged, success_callback, error_callback) {
        var credentials = { "Username": username, "Password": password, "LastChanged": lastchanged };
        chrome.storage.local.set((_a = {}, _a[domain] = credentials, _a), function () {
            var lasterror = chrome.runtime.lastError;
            if (lasterror) {
                console.log("Error while trying to save UserData: " + lasterror.message);
                error_callback();
            }
        });
        success_callback();
        console.log("Userdata has been saved");
        var _a;
    };
    Model.prototype.SaveMainData = function (hash, salt, iv, success_callback, error_callback) {
        var data = { "Hash": hash, "Salt": salt, "Iv": iv };
        chrome.storage.local.set({ MainData: data }, function () {
            var lasterror = chrome.runtime.lastError;
            if (lasterror) {
                console.log("Last error" + lasterror.message);
                error_callback();
            }
            success_callback();
            console.log("Main data has been saved");
        });
    };
    Model.prototype.SaveGeneralSettings = function (frequency, success_callback, error_callback) {
        if (frequency === void 0) { frequency = 30; }
        var data = { "Frequency": frequency };
        chrome.storage.local.set({ GeneralSettings: data }, function () {
            var lasterror = chrome.runtime.lastError;
            if (lasterror) {
                console.log("Last error" + lasterror.message);
                error_callback();
            }
            success_callback();
            console.log("GeneralSettings have been saved");
        });
    };
    Model.prototype.DeleteRecord = function (domain, success_callback, error_callback) {
        chrome.storage.local.remove([domain], function () {
            var lasterror = chrome.runtime.lastError;
            if (lasterror) {
                console.log("Error deleting record" + lasterror.message);
                error_callback();
            }
            console.log("key has been deleted");
            success_callback();
        });
    };
    Model.prototype.GetAllUserData = function (success_callback, error_callback) {
        chrome.storage.local.get(null, function (dataset) {
            var lasterror = chrome.runtime.lastError;
            if (lasterror) {
                console.log("Error retrieving value from storage" + lasterror.message);
                error_callback();
                return;
            }
            else if (Object.keys(dataset).length == 0) {
                console.log("Could not find any records");
                error_callback();
                return;
            }
            for (var key in dataset)
                if (key == "MainData" || key == "GeneralSettings")
                    delete dataset[key];
            success_callback(dataset);
        });
    };
    Model.prototype.GetUserData = function (domain, success_callback, error_callback) {
        var self = this;
        console.log("Trying to get data for: " + domain);
        chrome.storage.local.get([domain], function (dataset) {
            console.log(dataset);
            var lasterror = chrome.runtime.lastError;
            if (lasterror) {
                console.log("Error retrieving value from storage" + lasterror.message);
                error_callback();
                return;
            }
            else if (Object.keys(dataset).length == 0) {
                console.log("record does not exist");
                error_callback();
                return;
            }
            console.log("Found record. Returning");
            self.m_CurDataset = dataset[domain];
            success_callback(dataset[domain]);
        });
    };
    Model.prototype.GetMainData = function (success_callback, error_callback) {
        chrome.storage.local.get("MainData", function (dataset) {
            var lasterror = chrome.runtime.lastError;
            if (lasterror) {
                console.log("Error retrieving value from storage" + lasterror.message);
                error_callback();
                return;
            }
            else if (Object.keys(dataset).length == 0) {
                console.log("record does not exist");
                error_callback();
                return;
            }
            success_callback(dataset);
        });
    };
    Model.prototype.GetGeneralSettings = function (success_callback, error_callback) {
        chrome.storage.local.get("GeneralSettings", function (dataset) {
            var lasterror = chrome.runtime.lastError;
            if (lasterror) {
                console.log("Error retrieving value from storage" + lasterror.message);
                error_callback();
                return;
            }
            else if (Object.keys(dataset).length == 0) {
                console.log("record does not exist");
                error_callback();
                return;
            }
            success_callback(dataset);
        });
    };
    return Model;
}());
