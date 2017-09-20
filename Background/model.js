//chrome.storage.local.get(null, function (data) { console.info(data) });
/// <reference path="../Include/index.d.ts"/>
var Model = (function () {
    function Model() {
        this.m_CurDataset = null;
    }
    Model.prototype.SaveUserData = function (domain, username, password, lastchanged) {
        var credentials = { "Username": username, "Password": password, "LastChanged": lastchanged };
        chrome.storage.local.set((_a = {}, _a[domain] = credentials, _a), function () {
            var lasterror = chrome.runtime.lastError;
            if (lasterror)
                console.log("Last error" + lasterror.message);
        });
        console.log("Userdata has been saved");
        var _a;
    };
    Model.prototype.SaveMainData = function (hash, salt, iv) {
        var data = { "Hash": hash, "Salt": salt, "Iv": iv };
        chrome.storage.local.set({ MainData: data }, function () {
            var lasterror = chrome.runtime.lastError;
            if (lasterror)
                console.log("Last error" + lasterror.message);
            console.log("Main data has been saved");
        });
    };
    Model.prototype.SaveGeneralSettings = function (frequency) {
        if (frequency === void 0) { frequency = 30; }
        var data = { "Frequency": frequency };
        chrome.storage.local.set({ GeneralSettings: data }, function () {
            var lasterror = chrome.runtime.lastError;
            if (lasterror)
                console.log("Last error" + lasterror.message);
            console.log("Main data has been saved");
        });
    };
    Model.prototype.DeleteRecord = function (domain, callback) {
        chrome.storage.local.remove([domain], function () {
            var lasterror = chrome.runtime.lastError;
            if (lasterror) {
                console.log("Error deleting record" + lasterror.message);
                return;
            }
            console.log("key has been deleted");
            callback();
        });
    };
    Model.prototype.GetAllUserData = function (callback) {
        chrome.storage.local.get(null, function (dataset) {
            var lasterror = chrome.runtime.lastError;
            if (lasterror) {
                console.log("Error retrieving value from storage" + lasterror.message);
                return;
            }
            else if (Object.keys(dataset).length == 0) {
                console.log("Could not find any records");
                return;
            }
            for (var key in dataset)
                if (key == "MainData" || key == "GeneralSettings")
                    delete dataset[key];
            callback(dataset);
        });
    };
    Model.prototype.GetUserData = function (domain, callback) {
        var self = this;
        console.log("Trying to get data for: " + domain);
        chrome.storage.local.get([domain], function (dataset) {
            console.log(dataset);
            var lasterror = chrome.runtime.lastError;
            if (lasterror) {
                console.log("Error retrieving value from storage" + lasterror.message);
                callback(null);
                return;
            }
            else if (Object.keys(dataset).length == 0) {
                console.log("record does not exist");
                callback(null);
                return;
            }
            console.log("Found record. Returning");
            self.m_CurDataset = dataset[domain];
            callback(dataset[domain]);
        });
    };
    Model.prototype.GetMainData = function (callback) {
        chrome.storage.local.get("MainData", function (dataset) {
            var lasterror = chrome.runtime.lastError;
            if (lasterror) {
                console.log("Error retrieving value from storage" + lasterror.message);
                callback(null);
                return;
            }
            else if (Object.keys(dataset).length == 0) {
                console.log("record does not exist");
                callback(null);
                return;
            }
            callback(dataset);
        });
    };
    Model.prototype.GetGeneralSettings = function (callback) {
        chrome.storage.local.get("GeneralSettings", function (dataset) {
            var lasterror = chrome.runtime.lastError;
            if (lasterror) {
                console.log("Error retrieving value from storage" + lasterror.message);
                callback(null);
                return;
            }
            else if (Object.keys(dataset).length == 0) {
                console.log("record does not exist");
                callback(null);
                return;
            }
            callback(dataset);
        });
    };
    Model.prototype.GetCurDataset = function () {
        return this.m_CurDataset;
    };
    return Model;
}());
