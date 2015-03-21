// The module namespace... you can change this to something more fitting
var GW2App = GW2App || {}; 
GW2App = {
	pricev2JSON: "https://api.guildwars2.com/v2/commerce/prices/",
	itemv2JSON: "https://api.guildwars2.com/v2/items",
	itemDictionary: {}
};

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

