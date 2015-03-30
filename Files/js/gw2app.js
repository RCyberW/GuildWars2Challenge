// The module namespace... you can change this to something more fitting
var GW2App = GW2App || {}; 
GW2App = {
	// CONSTANTS
	MILLISECONDS = 1000,
	
	pricev2JSON: "https://api.guildwars2.com/v2/commerce/prices",
	itemv2JSON: "https://api.guildwars2.com/v2/items",
	itemDictionary: {},
	// We would need to store a map of item that the user want an update for to a price that they define
	watchList: {},
	// Store the result of each auto update for future use
	listOfUpdates: {},
	// Create a list of user specified alarm
	listOfAlarms: {},
	// Create a list of memo pages that user can edit/view
	listOfMemos: {}
};

// This should be robust enough for us to specify which method that we want to auto update per set interval
GW2App.autoRefresh = function(methodToUpdate, intervalPerUpdate, param1, param2....) {
	// Create an auto refresh for each method to update the price and the user view
	var myVar = setInterval(methodToUpdate, intervalPerUpdate * MILLISECONDS, /*How are we doing this?*/);
}

// - specify the item that the user want to keep track of
// - the amount to check for is greater than or less than that appears in the TP
// - isGreaterThan the comparison uses >= or <=
GW2App.createWatchItem = function(itemToWatchOutFor, amount, isGreaterThan) {
	// Internally when we store this to the map, we can store the itemID for ease of access later
}

GW2App.createAlert = function() {
	// Create an alert when one of the storedItems condition is met
	// This should go hand in hand with the autoRefresh
	// It should be a non-intrusive notification (i.e. flashing notification)
	// Something like the chat message, where the tab flashes
}

// - intervalAmount is how many minutes till countdown
// - nextTime is the absolute local time until the alarm
// - let user name the alarm
GW2App.createAlarm = function(intervalAmount, nextTime, alarmLabel) {
	// We can make alarm a subset of alert
	// It is meant for users to make an alarm for world boss or anything time based
	// They can set the alarm base on interval or time
	// I was imagining how the way the alarm/stopwatch work on the Android
}

// - memoID is a specific ID to refer back to
// - message is the content of the memo
// - type can be ranged specified by user, we can color coordinate them
GW2App.createMemo = function(memoID, message, type) {
	// A memo pad for user
	// We can leave up to the user to decide to categorize the memo (up for discussion)
	// Memo should be able to be tied in with alarm. (i.e. user creates memo: "Teq at 4PM", we should be able to create an alarm entry for Teq set for 4PM)
}

// returns the prices and info for all itemIds
// - itemIds can be a single id or array of ids
GW2App.getItemPrices = function(itemIds, callback) {
	var query = "";
	if($.isArray(itemIds)){
		itemIds.forEach(function(item) { query += item + ","; });
	} else {
		query = itemIds;
	}
	
	var itemList = [];
	
	// get the info for items
	$.getJSON(GW2App.itemv2JSON + "?ids=" + query, function(itemInfos) {
	
		itemInfos.forEach(function(info) {
			itemList.push(info);
		});
		
		// get prices for items
		$.getJSON(GW2App.pricev2JSON + "?ids=" + query, function(prices) {
		
			// this assumes that item list and price lists are the same length
			prices.forEach(function(price, idx) {
				itemList[idx].price = price;
			});
			
			callback(new Response(itemList));
		}).error(function(response) {
			// can't find the prices
			callback(new Error(response.responseText));
		});
		
	}).error(function(response) {
		// invalid ids or something went wrong...
		callback(new Error(response.responseText));
	});
};

// get all the item id and their info - this is not efficient... just testing if it works
GW2App.getAllItems = function(callback) {
	GW2App.itemDictionary = {};
	$.getJSON(GW2App.itemv2JSON, function(itemIds) {
		var subArrSize = 200; // the item API only accepts 200 item ids at a time
		var startIndex = 0;
		var endIndex = subArrSize;
		while(endIndex < itemIds.length) {
			var subArr = itemIds.slice(startIndex, endIndex);
			$.getJSON(GW2App.itemv2JSON + "?ids=" + subArr, function(itemInfos) {
				itemInfos.forEach(function(item) {
					GW2App.itemDictionary[item.id] = item.name;
				});
			});
			startIndex += subArrSize;
			endIndex += subArrSize;
		}
	});
};

// All API calls will return this Response object
var Response = function(data,errorMsg) {
	this.data = data;
	this.errorMsg = errorMsg; // error text
	this.success = true;
};
// someone goofed
var Error = function(errorMsg) {
	Response.call(this,null,errorMsg);
	this.success = false;
};
Error.prototype = Object.create(Response.prototype);


// For Testing
GW2App.testMe = function() {
	// check item prices
	//GW2App.getItemPrices([19684, 13328, 2279], function(response) {console.log(response);});
	//GW2App.getItemPrices([1,3], function(response) { console.log(response); });
		
	// getting all da items...
	//GW2App.getAllItems(function(response) { console.log(response); });
}; 

