/**
 * Twitter API Adapter. Requires jQuery for ajax calls.
 * @author Ryan Sandor Richards
 * @copyright 2010 Ryan Sandor Richards
 */
function Twitter() {
	this.baseURL = 'http://twitter.com/';
	
	/**
	 * Makes a request to the twitter API.
	 * TODO Account for rate limiting
	 * @param params Request parameters (no need for URL encoding).
	 * @param callback Function to call when the response is obtained.
	 */
	this.makeRequest = function(service, params, callback) {
		var url = this.baseURL + service + '.json?callback=?';
		
		// Append parameters
		if (params != null) {
			for (var k in params) {
				url += '&' + k + '=' + escape(params[k]);
			}
		}
		
		// Make the request
		if (callback == null || typeof(callback) != 'function') {
			$.getJSON(url);
		}
		else {
			$.getJSON(url, callback)
		}
	};
	
	this.rateLimitStatus = function(callback) {
		this.makeRequest('account/rate_limit_status', {}, callback);
	}
	
	/** 
	 * Retrieves user information from twitter.
	 * @param screen_name Screen name for the user.
	 * @param callback Function to call when response is obtained.
	 */
	this.getUser = function(screen_name, callback) {
		if (!screen_name.match(/^[a-zA-Z0-9]+$/)) {
			throw "Invalid screen name: " + screen_name;
		}
		this.makeRequest('users/show', {screen_name: screen_name}, callback);
	};
	
	/**
	 * Retrieves user timeline information.
	 * @param screen_name Name of the twitter user.
	 * @param page The page number to retrieve. Pages contain a maximum of 200 entries, and
	 *   the first page contains the most recent timeline entries.
	 * @param callback Function to call when response is obtained.
	 */
	this.getUserTimeline = function(screen_name, page, callback) {
		if (!screen_name.match(/^[a-zA-Z0-9]+$/)) {
			throw "Invalid screen name: " + screen_name;
		}

		this.makeRequest('statuses/user_timeline', {screen_name: screen_name, page: page, count: 200}, function(timeline) {
			timeline.pages = 1;
			callback(timeline);
		});
	};
	
	/**
	 * Retrieves an extended user timeline. The Twitter API only allows for a maximum of 200 statuses to
	 * be returned in a single request. This function takes a pages argument that determines how many pages
	 * of information to retrieve from the service (usually sized at about 200). If there are fewer pages
	 * than the requested amount available this function will simply calculate the timeline given all
	 * of the data available from Twitter.
	 *
	 * Note: when using this function you can quickly reach your maximum allowed requests per hour
	 * (150), so be careful how many pages of information you request at a given time.
	 *
	 * @param screen_name Name of the user for which to get timeline data.
	 * @param pages Maximum number of pages to retrieve.
	 * @param callback Function to call when the final response is obtained.
	 * @throws Exception if the screen name is invalid.
	 */
	this.getExtendedTimeline = function(screen_name, pages, callback) {
		if (!screen_name.match(/^[a-zA-Z0-9]+$/)) {
			throw "Invalid screen name: " + screen_name;
		}
		
		var totalTimeline = [];
		var twitter = this;
		function request(page) {
			if (page == null) {
				page = 1;
			}
			twitter.makeRequest('statuses/user_timeline', {screen_name: screen_name, count: 200, page: page}, function(timeline) {
				totalTimeline = totalTimeline.concat(timeline);
				pages--;
				if (pages == 0 || timeline.length == 0) {
					totalTimeline.pages = pages;
					callback(totalTimeline);
				}
				else {
					request(page+1)
				}
			});
		}
		
		request();
	};
	
	
	/** 
	 * Returns a detailed list of the first 100 followers of a given user.
	 * @param screen_name Name of the user for which to fetch the followers.
	 * @param callback Function to call when the response has been returned.
	 */
	this.getFollowers = function(screen_name, callback, cursor) {
		if (!screen_name.match(/^[a-zA-Z0-9]+$/)) {
			throw "Invalid screen name: " + screen_name;
		}
		if (cursor == null) {
			cursor = -1;
		}
		this.makeRequest('statuses/followers', {screen_name: screen_name, cursor: cursor}, callback);
	};
	
	/** 
	 * Returns a detailed list of the first 100 friends of a given user.
	 *
	 * TODO Utilize cursor param and abstract into private function with getFollowers().
	 * 
	 * @param screen_name Name of the user for which to fetch the friends.
	 * @param callback Function to call when the response has been returned.
	 */
	this.getFriends = function(screen_name, callback, cursor) {
		if (!screen_name.match(/^[a-zA-Z0-9]+$/)) {
			throw "Invalid screen name: " + screen_name;
		}
		this.makeRequest('statuses/friends', {screen_name: screen_name}, callback);
	};
	
	/**
	 * Returns a detailed list of followers for a given user. Because of limitations imposed by the
	 * twitter API we can only request 100 followers at a time. For "normal" users this is fine, but
	 * for "super" users this can pose a problem.
	 * 
	 * In order to collect more than 100 followers use the pages parameter to set the number of pages
	 * of information you would like compiled into a basic list. Remember each page represents a single
	 * request and users are limited to 150 requests / hour, so use wisely.
	 *
	 * @param screen_name Name of the user of which to request the followers.
	 * @param pages Number of pages to retrieve.
	 * @param callback Function to call when all of the pages have been retrieved.
	 */
	this.getManyFollowers = function(screen_name, pages, callback) {
		// TODO Implement me... if needed
	};
}