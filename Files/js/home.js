// CONSTANTS
var MILLISECONDS = 1000;

// GUILD WARS 2 JSON CALLS
var pricev2JSON = "https://api.guildwars2.com/v2/commerce/prices";
var itemv2JSON = "https://api.guildwars2.com/v2/items";
var itemsv1JSON = "https://api.guildwars2.com/v1/items.json";

// GLOBAL VARS
var count = 0;

function listItemInfo() {
	var itemList;
	$.getJSON( itemv2JSON, function( data ) {
		itemList = data;
		
	});
}

function getItemPrices() {
	count++;
	var itemIds = [19684, 13328, 2279];
	
	var priceDetail;
	var itemDetail;
	var i;
	var priceIds = "?ids=" + itemIds.join(',');
	
	debug(count);
	
	$.getJSON( pricev2JSON + priceIds, function( prices ) {
		priceDetail = prices;
		$.getJSON( itemv2JSON  + priceIds, function( items ) {
			itemDetail = items;
			for (i = 0; i < itemDetail.length; i++) {
				var itemId = priceDetail[i].id;
				
				if ($("#" + itemId + "_price").length == 0) {
					// It doesn't exist, write the values
					$('#pricewatch tr:last').after('<tr><td id=' + itemId + '_name>' + itemDetail[i].name + '</td><td id=' + itemId + '_price>' + priceDetail[i].buys.unit_price + '</td></tr>');
				} else {
					// It exists, update values
					$("#" + itemId + "_name").value = itemDetail[i].name;
					$("#" + itemId + "_price").value = priceDetail[i].buys.unit_price;
				}
			}
		});
	});
}

var myVar;
function myFunction() {
	getItemPrices();
	myVar = setInterval(getItemPrices, 60 * MILLISECONDS);
}

// OverWolf Window functions
function dragResize(edge){
	overwolf.windows.getCurrentWindow(function(result){
		if (result.status=="success"){
			overwolf.windows.dragResize(result.window.id, edge);
		}
	});
};
function dragMove(){
	overwolf.windows.getCurrentWindow(function(result){
		if (result.status=="success"){
			overwolf.windows.dragMove(result.window.id);
		}
	});
};
function closeWindow(){
	overwolf.windows.getCurrentWindow(function(result){
		if (result.status=="success"){
			overwolf.windows.close(result.window.id);
		}
	});
};