//chrome.storage.local.get(null, function (data) { console.info(data) });
/// <reference path="../Include/index.d.ts"/>
class Model {
	private m_CurDataset: object;
	constructor(){}
	SaveUserData(domain:string, username:string, password:string):void {
		let credentials = {"Username": username, "Password": password};
		chrome.storage.local.set({[domain] : credentials}, function() {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
				console.log("Last error" + lasterror.message);
		});
	}
	GetUserData(domain:string, callback:(data:object)=>any): void {
		let self = this;
		console.log("Trying to get data for:" + domain);
		chrome.storage.local.get([domain], function(dataset) {
			console.log(dataset);
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
			{
				console.log("Error retrieving value from storage" + lasterror.message);
				callback(null);
			}
			else if (Object.keys(dataset).length == 0) 
			{
				console.log("record does not exist");
				callback(null);
			}
			console.log("Found record. Returning");
			self.m_CurDataset = dataset;
			callback(dataset);
		});
	}
	GetCurDataset(): any {
		return this.m_CurDataset;
	}
	Authenticate(password:string) {

	}
}

