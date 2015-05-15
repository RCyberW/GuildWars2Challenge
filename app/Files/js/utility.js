var Utility = Utility || {}; 
Utility = {
	urlExists : function(url) {
		var http = new XMLHttpRequest();
		http.open('HEAD', url, false);
		http.send();
		return http.status!=404;
	},
	
	closeSearchResults : function(id) {
		$('#' + id).fadeOut(200);
	}
}