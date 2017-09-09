//chrome.storage.local.get(null, function (data) { console.info(data) });
/// <reference path="../Include/index.d.ts"/>
var Model = (function () {
    function Model() {
    }
    Model.prototype.SaveUserData = function (domain, username, password) {
        var credentials = { "Username": username, "Password": password };
        chrome.storage.local.set((_a = {}, _a[domain] = credentials, _a), function () {
            var lasterror = chrome.runtime.lastError;
            if (lasterror)
                console.log("Last error" + lasterror.message);
        });
        var _a;
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
                if (key == "MainData")
                    delete dataset[key];
            console.info(dataset);
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
                return;
            }
            else if (Object.keys(dataset).length == 0) {
                console.log("record does not exist");
                return;
            }
            console.log("Found record. Returning");
            self.m_CurDataset = dataset[domain];
            callback(dataset[domain]);
        });
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
    Model.prototype.GetCurDataset = function () {
        return this.m_CurDataset;
    };
    return Model;
}());
