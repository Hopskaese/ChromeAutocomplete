//chrome.storage.local.get(null, function (data) { console.info(data) });
/// <reference path="../Include/index.d.ts"/>
class Model {
	private m_CurDataset: object;
	constructor()
	{
		this.m_CurDataset = null;
	}
	SaveUserData(domain:string, username:string, password:string, lastchanged: number):void {
		let credentials = {"Username": username, "Password": password, "LastChanged": lastchanged};
		chrome.storage.local.set({[domain] : credentials}, function() {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
				console.log("Last error" + lasterror.message);
		});
		console.log("Userdata has been saved");
	}
	SaveMainData(hash:string, salt:string, iv:string):void {
		let data = {"Hash": hash, "Salt":salt, "Iv":iv};
		chrome.storage.local.set({MainData : data}, function() {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
				console.log("Last error" + lasterror.message);

			console.log("Main data has been saved");
		});
	}
	SaveGeneralSettings(frequency:number = 30)
	{
		let data = {"Frequency": frequency};
		chrome.storage.local.set({GeneralSettings: data}, function() {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
				console.log("Last error" + lasterror.message);

			console.log("Main data has been saved");
		});
	}
	DeleteRecord(domain:string, callback:()=>any):void {
		chrome.storage.local.remove([domain], function() {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
			{
				console.log("Error deleting record" + lasterror.message);
				return;
			}
			console.log("key has been deleted");
			callback();
		});
	}
	GetAllUserData(callback:(data:object)=>any): void {
		chrome.storage.local.get(null, function(dataset:any) {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
			{
				console.log("Error retrieving value from storage" + lasterror.message);
				callback(null);
			}
			else if (Object.keys(dataset).length == 0) 
			{
				console.log("Could not find any records");
				callback(null);
			}
			for (let key in dataset)
				if (key == "MainData" || key == "GeneralSettings")
					delete dataset[key];

			callback(dataset);
		});
	}
	GetUserData(domain:string, callback:(data:object)=>any): void {
		let self = this;
		console.log("Trying to get data for: " + domain);
		chrome.storage.local.get([domain], function(dataset:any) {
			console.log(dataset);
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
			{
				console.log("Error retrieving value from storage" + lasterror.message);
				callback(null);
				return;
			}
			else if (Object.keys(dataset).length == 0) 
			{
				console.log("record does not exist");
				callback(null);
				return;
			}
			console.log("Found record. Returning");
			self.m_CurDataset = dataset[domain];
			callback(dataset[domain]);
		});
	}
	GetMainData(callback:(MainData:object)=>any): void {
		chrome.storage.local.get("MainData", function(dataset) {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
			{
				console.log("Error retrieving value from storage" + lasterror.message);
				callback(null);
				return;
			}
			else if (Object.keys(dataset).length == 0) 
			{
				console.log("record does not exist");
				callback(null);
				return;
			}
			callback(dataset);
		});
	}
	GetGeneralSettings(callback:(MainData:object)=>any):void {
		chrome.storage.local.get("GeneralSettings", function(dataset) {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
			{
				console.log("Error retrieving value from storage" + lasterror.message);
				callback(null);
				return;
			}
			else if (Object.keys(dataset).length == 0) 
			{
				console.log("record does not exist");
				callback(null);
				return;
			}
			callback(dataset);
		});
	}
	GetCurDataset(): any {
		return this.m_CurDataset;
	}
}

