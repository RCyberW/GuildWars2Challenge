// The module namespace... you can change this to something more fitting
var GW2App = GW2App || {}; 
GW2App = {
	// CONSTANTS
	INTERVAL_PER_UPDATE: 1,
	MILLISECONDS: 1000,
	
	pricev2JSON: "https://api.guildwars2.com/v2/commerce/prices",
	itemv2JSON: "https://api.guildwars2.com/v2/items",
	iconv2JSON: "https://api.guildwars2.com/v2/files",
	
	gw2spidySearchJSON: "http://www.gw2spidy.com/api/v0.9/json/item-search/",
	
	rarityLevel: ["basic", "fine", "masterwork", "rare", "exotic", "ascended", "legendary"],	
	
	autoUpdating: false,
	
	itemDictionary: {},
	// We would need to store a map of item that the user want an update for to a price that they define - item-id to WatchItem
	watchList: {},
	investmentList: {},
	// Store the result of each auto update for future use - probably don't need
	// listOfUpdates: [],
	// Create a list of user specified alarm
	listOfAlarms: [],
	// Create a list of memo pages that user can edit/view
	listOfMemos: [],
	// Listener for when item in WatchList is met
	watchItemListeners: [],
	// Listener for when alarm is ringing
	alarmListeners: [],
	
	watchBuyList:[],
	watchSellList:[],

	goldIcon: "",
	silverIcon: "",
	copperIcon: "",
	
	// calls the update function at every time interval
	beginAutoRefresh : function() {
		if (!this.autoUpdating) { // so we don't call it multiple times
			setInterval(this.refresh,this.INTERVAL_PER_UPDATE * this.MILLISECONDS);
			this.autoUpdating = true;
		}
	},

	getIcons : function() {
	//TODO convert this to static images
		$.getJSON(iconv2JSON + "?id=ui_coin_gold", function(response) {
			// If only one page, then go ahead with creating the list
			goldIcon = response.icon;
		});
		
		$.getJSON(iconv2JSON + "?id=ui_coin_silver", function(response) {
			// If only one page, then go ahead with creating the list
			silverIcon = response.icon;
		});
		
		$.getJSON(iconv2JSON + "?id=ui_coin_copper", function(response) {
			// If only one page, then go ahead with creating the list
			copperIcon = response.icon;
		});
	},
	
	// checks the conditions for watch list and alarms
	refresh : function() {
		var self = GW2App;
		// check prices in watch list
		var itemIdsToCheck = [];
		for(var itemId in self.watchList) {
			if (self.watchList.hasOwnProperty(itemId)) {
				itemIdsToCheck.push(itemId);
			}
		}
		
		if (itemIdsToCheck.length > 0) {
			// call the GW2 API for prices
			self.getItemPrices(itemIdsToCheck, function(result) {
				if (result.success) {
					for (var i = 0; i < result.data.length; i++) {
						var price = result.data[i];
						var itemId = price.id;
						var watchItem = self.watchList[itemId];
						var currentSellPrice = 0;//price.sells.unit_price;
						
						// logic for checking item prices?
						if ((watchItem.isGreaterThan && watchItem.amount <= currentSellPrice) || 
							(!watchItem.isGreaterThan && watchItem.amount >= currentSellPrice)) {
							notifyWatchItemListeners(watchItem);
							this.watchList.remove(itemId);
						}						
					}
				}
			});
		}
		
		// check alarms
		var currentTime = new Date().getTime();
		for (var alarm in self.listOfAlarms) {
			alarm.intervalAmount = Math.max(alarm.nextTime - currentTime, 0);
			if (intervalAmount == 0) { // sound the alarm!
				for (var listener in self.alarmListeners) {
					notifyAlarmListeners(alarm);
					listener(alarm);
				}
				listOfAlarms.remove(alarm);
			}
		};
	},

	// listener - function to call when WatchItem price is met
	addWatchItemListener : function(listener) {
		this.watchItemListeners.push(listener);
	},

	// listener - function to call when alarm is ringing
	addAlarmListener : function(listener) {
		this.alarmListeners.push(listener);
	},
	
	// watchItem - the watch item that price has matched
	notifyWatchItemListeners : function(watchItem) {
		for (var listener in this.watchItemListeners) {
			listener(alarm);
		}
	},
	
	// alarm - the alarm that is ringing
	notifyAlarmListeners : function(alarm) {
		for (var listener in this.alarmListeners) {
			listener(alarm);
		}
	},

	// - specify the item that the user want to keep track of
	// - the amount to check for is greater than or less than that appears in the TP
	// - isGreaterThan the comparison uses >= or <=
	createWatchItem : function(itemToWatchOutFor, amount, isGreaterThan) {
		// Internally when we store this to the map, we can store the itemID for ease of access later
		this.watchList[itemToWatchOutFor] = new WatchItem(itemToWatchOutFor, amount, isGreaterThan);
		
		var watchListItems = "";
		$.each(this.watchList, function(key, value) {
			watchListItems += key + ",";
		});
		this.saveToLocalStorage("WatchList", watchListItems);
	},
	
	createInvestmentItem: function(itemToWatchOutFor, amount, buy) {
		this.investmentList[itemToWatchOutFor] = new InvestmentItem(itemToWatchOutFor, amount, buy);
		
		var investmentListItems = "";
		$.each(this.investmentList, function(key, value) {
			investmentListItems += key + ":" + value.amount + ":" + value.price + ",";
		});
		this.saveToLocalStorage("InvestmentList", investmentListItems);
	},
	
	// - specify the item that the user want to remove
	removeWatchItem : function(itemToWatchOutFor) {
		if (itemToWatchOutFor in this.watchList) {
			delete this.watchList[itemToWatchOutFor];
		}
		
		var watchListItems = "";
		$.each(this.watchList, function(key, value) {
			watchListItems += key + ",";
		});
		this.saveToLocalStorage("WatchList", watchListItems);
	},
	
	// - specify the item that the user want to remove
	removeInvestmentItem : function(itemToWatchOutFor) {
		if (itemToWatchOutFor in this.investmentList) {
			delete this.investmentList[itemToWatchOutFor];
		}
		
		var investmentListItems = "";
		$.each(this.investmentList, function(key, value) {
			investmentListItems += key + ":" + value.amount + ":" + value.price + ",";
		});
		this.saveToLocalStorage("InvestmentList", investmentListItems);
	},

	// - intervalAmount is how many minutes till countdown
	// - nextTime is the absolute local time until the alarm
	// - let user name the alarm
	createAlarm : function(intervalAmount, nextTime, alarmLabel) {
		// We can make alarm a subset of alert
		// It is meant for users to make an alarm for world boss or anything time based
		// They can set the alarm base on interval or time
		// I was imagining how the way the alarm/stopwatch work on the Android
		this.listOfAlarms.push(new Alarm(intervalAmount,nextTime,alarmLabel));
	},

	// - memoID is a specific ID to refer back to
	// - message is the content of the memo
	// - type can be ranged specified by user, we can color coordinate them
	createMemo : function(memoID, message, type) {
		// A memo pad for user
		// We can leave up to the user to decide to categorize the memo (up for discussion)
		// Memo should be able to be tied in with alarm. (i.e. user creates memo: "Teq at 4PM", we should be able to create an alarm entry for Teq set for 4PM)
		this.listOfMemos.push(new Memo(memoID,message,type));
	},

	// Allow the user to search items by name instead of using item ID.
	// This will take the user input and translate that into item ID for backend processing
	getItemIDByName : function(itemName, pageCount, callback) {
		var self = GW2App;
		var myUrl = this.gw2spidySearchJSON + itemName + "/" + pageCount;
		
		var itemQuery = "";
		
		$.getJSON(myUrl, function(response) {
			// If only one page, then go ahead with creating the list
			for(var i = 0; i < response.results.length; i++) {
				var itemID = response.results[i].data_id;
				itemQuery += itemID + ","
			}
			self.getItemInfoAndPrices(itemQuery, response.page, response.last_page, callback);
		});
	},
	
	// returns info and prices from the GW2 API for specified itemIds
	getItemInfoAndPrices : function(itemIds, currentPage, lastPage, callback) {	
		var self = GW2App;
		self.getItemInfo(itemIds, function(infoResult) {
			if (infoResult.success) { 
				var items = {};
				for (var i = 0; i < infoResult.data.length; i++) {
					var itemInfo = infoResult.data[i];
					items[itemInfo.id] = itemInfo;
				}	
				
				self.getItemPrices(itemIds, function(priceResult) {
					if (priceResult.success) {
						var responseItemList = [];
						
						for (var i = 0; i < priceResult.data.length; i++) {
							var price = priceResult.data[i];
							var item = items[price.id];
							item.price = price;
							
							responseItemList.push(item);
						}
						
						callback(new Response(new ResultList(responseItemList, currentPage, lastPage)));
					} else {
						callback(new Error(priceResult.error));
					}
				});
				
			} else { 
				callback(new Error(infoResult.error));
			}
		});
	},
	
	// returns the info from the GW2 API for all itemIds
	// - itemIds can be a single id or array of ids
	getItemInfo : function(itemIds, callback) {
		var query = "";
		if($.isArray(itemIds)){
			query = itemIds.join(',');
		} else {
			query = itemIds;
		}
		// get the info for items
		$.getJSON(this.itemv2JSON + "?ids=" + query, function(itemInfos) {
			var itemList = [];
			itemInfos.forEach(function(info) {
				itemList.push(info);
			});
			callback(new Response(itemList));
		}).error(function(response) {
			// invalid ids or something went wrong...
			callback(new Error(response.responseText));
		});
	},

	// returns the prices from the GW2 API for all itemIds
	// - itemIds can be a single id or array of ids
	getItemPrices : function(itemIds, callback) {
		var query = "";
		if($.isArray(itemIds)){
			itemIds.forEach(function(item) { query += item + ","; });
		} else {
			query = itemIds;
		}
		// get prices for items
		var jsonCall = this.pricev2JSON + "?ids=" + query;
		$.getJSON(jsonCall, function(prices) {
			var priceList = [];
			prices.forEach(function(price) {
				priceList.push(price);
			});
			callback(new Response(priceList));
		}).error(function(response) {
			// can't find the prices
			callback(new Error(response.responseText));
		});
		
	},

	// get all the item id and their info - this is not efficient... just testing if it works
	getAllItems : function(callback) {
		this.itemDictionary = {};
		$.getJSON(this.itemv2JSON, function(itemIds) {
			var subArrSize = 200; // the item API only accepts 200 item ids at a time
			var startIndex = 0;
			var endIndex = subArrSize;
			while(endIndex < itemIds.length) {
				var subArr = itemIds.slice(startIndex, endIndex);
				$.getJSON(this.itemv2JSON + "?ids=" + subArr, function(itemInfos) {
					itemInfos.forEach(function(item) {
						this.itemDictionary[item.id] = item.name;
					});
				});
				startIndex += subArrSize;
				endIndex += subArrSize;
			}
		});
	},
	
	// Store the value to the local storage
	// key - the key
	// value - the value
	saveToLocalStorage : function(key, value) {
		value = value.substring(0, value.length - 1);
		localStorage.setItem(key, value);
		
		var checkValue = localStorage.getItem(key);
		if (checkValue == null) {
			console.log("Something is wrong");
		}
	},
	
	getFromLocalStorage : function(key, restoreList) {
		var value = localStorage.getItem(key);
		// var returnlist = JSON.parse(value);
		return value;
	},
	
	// Convert price to a human readable value
	convertPriceToReadablePrice : function(price) {
		var copper = price % 100;
		var silver = price/100 % 100;
		var gold = price/10000;
		
		var retString = "";
		
		if (gold > 0) {
			retString += parseInt(gold) + "<img src='https://render.guildwars2.com/file/090A980A96D39FD36FBB004903644C6DBEFB1FFB/156904.png' class='coin-size'>";
		} 
		retString += '<br>';
		if (gold > 0 || silver > 0) {
			retString += parseInt(silver) + "<img src='https://render.guildwars2.com/file/E5A2197D78ECE4AE0349C8B3710D033D22DB0DA6/156907.png' class='coin-size'>";
		} 
		retString += '<br>';
		retString += parseInt(copper) + "<img src='https://render.guildwars2.com/file/6CF8F96A3299CFC75D5CC90617C3C70331A1EF0E/156902.png' class='coin-size'>";
		
		return retString;
	}
};

/*
// This should be robust enough for us to specify which method that we want to auto update per set interval
GW2App.autoRefresh = function(methodToUpdate, intervalPerUpdate, param1, param2....) {
	// Create an auto refresh for each method to update the price and the user view
	// var myVar = setInterval(methodToUpdate, intervalPerUpdate * MILLISECONDS,); //How are we doing this?
};

GW2App.createAlert = function() {
	// Create an alert when one of the storedItems condition is met
	// This should go hand in hand with the autoRefresh
	// It should be a non-intrusive notification (i.e. flashing notification)
	// Something like the chat message, where the tab flashes
};
*/


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

// item from GW2 API 
var Item = function() {};

// item price from GW2 API 
// properties: id, buys.quantity, buys.unit_price, sells.quantity, sells.unit_price
var ItemPrice = function() {};

var ResultList = function(currentList, currentPage, lastPage) {
	this.currentList = currentList;
	this.currentPage = currentPage;
	this.lastPage = lastPage;
};

// - the item-id that the user want to keep track of
// - the amount to check for is greater than or less than that appears in the TP
// - isGreaterThan the comparison uses >= or <=
var WatchItem = function(itemToWatchOutFor, amount, isGreaterThan) {
	this.itemToWatchOutFor = itemToWatchOutFor;
	this.amount = amount;
	this.isGreaterThan = isGreaterThan;
};

// - the item-id that the user want to keep track of
// - the amount the user bought
// - the price the user bought
var InvestmentItem = function(itemToWatchOutFor, amount, price) {
	this.itemToWatchOutFor = itemToWatchOutFor;
	this.amount = amount;
	this.price = price;
};

// - intervalAmount is how many minutes till countdown
// - nextTime is the absolute local time until the alarm
// - let user name the alarm
var Alarm = function(intervalAmount, nextTime, alarmLabel) {
	this.intervalAmount = intervalAmount;
	this.nextTime = nextTime;
	this.alarmLabel = alarmLabel;
};

// - memoID is a specific ID to refer back to
// - message is the content of the memo
// - type can be ranged specified by user, we can color coordinate them
var Memo = function(memoID, message, type) {
	this.memoID = memoID;
	this.message = message;
	this.type = type;
};

// For Testing
GW2App.testMe = function() {
	// check item prices
	//GW2App.getItemPrices([19684, 13328, 2279], function(response) {console.log(response);});
	//GW2App.getItemPrices([1,3], function(response) { console.log(response); });
		
	// getting all da items...
	//GW2App.getAllItems(function(response) { console.log(response); });
}; 
