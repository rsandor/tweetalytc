/**
 * Tweetalytc Twitter Statistics Gathering Engine
 * @requires tweetalytc.js
 * @author Ryan Sandor Richards
 * @copyright 2010 Ryan Sandor Richards
 */
function Tweetalytc(screen_name) {
	this.screen_name = screen_name;
	
	/**
	 * Given two Date objects this determines if they represent different days.
	 * @param d1 First Date object.
	 * @param d2 Second Date object.
	 * @return True if the the Dates are different, false otherwise.
	 */
	this.differentDay = function(d1, d2) {
		return d1.getDate() != d2.getDate() || d1.getMonth() != d2.getMonth() || d1.getYear() != d2.getYear();
	};
	
	/**
	 * Loads all relevant user information.
   * @praam callback Function to call when all requests have been made.
   */
	this.loadUser = function(callback) {
		var user;
		var tweetalytc = this;
		var screen_name = this.screen_name;
		var twitter = new Twitter();
		
		// First load the user data from twitter...
		twitter.getUser(screen_name, function(userData) {
			user = userData;			
			
			// Next load the timeline data...
			twitter.getUserTimeline(screen_name, 1, function(timeline) {
				user.timeline = tweetalytc.processTimeline(timeline);			
					
				// Next load the followers information...
				twitter.getFollowers(screen_name, function(followers) {
					user.followers = tweetalytc.processFollowers(followers);
					
					// Finally load the friends information and make the callback.
					twitter.getFriends(screen_name, function(friends) {
						user.friends = tweetalytc.processFriends(friends);
						callback(user);
					});
				});
			});
		});
	};
	
	/**
	 * Processes timelines and extracts data from Twitter API responses. Specifically it buckets
	 * all of the statuses by day and collects totals and averages over the statuses in the
	 * timeline.
	 * 
	 * The method returns a hash containing the processed timeline information. That hash contains
	 * the following keys:
	 *
	 *   statuses - An array containing all the statuses from the processed timeline.
	 *   days - An array containing daily information for active days ordered decreasing by date.
	 *   total_statuses_length - Total amount of text in all statuses in given timeline.
	 *   average_status_length - The average length of a status update.
	 *   average_statuses_per_day - Average number of status updates per day.
	 *   total_statuses - Total number of status update processed.
	 *   
	 * Each of the days in the "days" array has the following information:
	 *
	 *   date - The exact date of the last status update on that day.
	 *   statuses - An array containing the statuses that occurred on that day.
	 *   total_status_length - The combined length of all statuses that occured on that day.
	 *   average_status_length - The average length of statuses on that day.
	 *   velocity - The rate of change in statuses from the day before (if available, null otherwise).
	 *   
	 * @param timeline Object containing timeline information.
	 * @return A stats hash containing as described above.
	 */
	this.processTimeline = function(timeline) {
		var tweetalytc = this;
		var stats = {
			statuses: timeline,
			days: [],
			total_statuses_length: 0,
			average_status_length: 0,
			average_statuses_per_day: 0,
			pages: timeline.pages
		};
		var lastDate = null;
		
		for (var i = 0; i < timeline.length; i++) {
			var entry = timeline[i];
			var date = new Date(Date.parse(entry.created_at));
			
			if (lastDate == null || this.differentDay(date, lastDate)) {
				// Calculate averages if need be
				if (lastDate != null) {
					var lastIndex = stats.days.length-1;
					var lastDay = stats.days[lastIndex];
					stats.days[lastIndex].average_status_length = 
						parseFloat(new Number(lastDay.total_statuses_length / lastDay.statuses.length).toFixed(2));
				}
				
				// Calculate velocity if need be
				if (stats.days.length > 1) {
					var x0 = stats.days.length - 1;
					var x1 = stats.days.length - 2;
					stats.days[x1].velocity = stats.days[x1].statuses.length - stats.days[x0].statuses.length;
				}
				
				// Append a new day hash
				stats.days.push({
					date: date,
					statuses: [], 
					total_statuses_length: 0,
					average_status_length: 0,
					velocity: null
				});
			}
			lastDate = date;
			
			stats.total_statuses_length += entry.text.length;
			var dayIndex = stats.days.length - 1;
			stats.days[dayIndex].statuses.push(entry);
			stats.days[dayIndex].total_statuses_length += entry.text.length;	
		}
		
		if (timeline.length > 0) {
			stats.average_status_length = parseFloat(new Number(stats.total_statuses_length / timeline.length).toFixed(2));
		}
		
		if (stats.days.length > 0) {
			stats.average_statuses_per_day = parseFloat(new Number(timeline.length / stats.days.length).toFixed(2));
		}
		
		/**
		 * Adds an additional page of 200 statuses if available.
		 * @param callback Function to exectue when the timeline has been updated. The only
		 *   parameter for the call back will be a boolean indicator that is true if new data
		 *   was added and false if no new data was added (we have all the data available).
		 */
		stats.more = function(callback) {
			var thisTimeline = this;
			var twitter = new Twitter();
			
			twitter.getUserTimeline(screen_name, thisTimeline.pages + 1, function(timeline) {
				if (timeline.length == 0) {
					// No changes. Remove the "more" function and execute the callback.
					thisTimeline.more = function(callback) { callback(false) };
					callback(false);
				}
				else {
					// Process the new timeline
					timeline = tweetalytc.processTimeline(timeline);
					
					// Update statuses list
					thisTimeline.statuses = thisTimeline.statuses.concat(timeline.statuses);
					
					// Update the days list
					var lastDay = thisTimeline.days.pop();
					var firstDay = timeline.days.pop();
					if (!tweetalytc.differentDay(firstDay.date, lastDay.date)) {
						lastDay.statuses = lastDay.statuses.concat(firstDay.statuses)
						lastDay.total_statuses_length += firstDay.total_statuses_length;
						lastDay.average_status_length = parseFloat(new Number(
							(lastDay.average_status_length + firstDay.average_status_length) / 2
						).toFixed(2));
						lastDay.velocity = firstDay.velocity;
						thisTimeline.days.push(lastDay);
					}
					else {
						thisTimeline.days.push(lastDay);
						thisTimeline.days.push(firstDay);
					}
					thisTimeline.days = thisTimeline.days.concat(timeline.days);
					
					// Update flat statistics
					thisTimeline.total_statuses_length += timeline.total_statuses_length;
			
					thisTimeline.average_status_length = parseFloat(new Number(
						(timeline.average_status_length + thisTimeline.average_status_length) / 2
					).toFixed(2));
			
					thisTimeline.average_statuses_per_day = parseFloat(new Number(
						(thisTimeline.average_statuses_per_day + timeline.average_statuses_per_day) / 2
					).toFixed(2));
			
					thisTimeline.pages += 1;
					
					// Execute the callback function
					callback(true);
				}
			});
		};
		
		return stats;
	};
	
	/**
	 * Processes a list of users and derives statistics. Specifically this method
	 * returns a statistics hash that contains the following keys:
	 *
	 *   users - The original list of users.  
	 *   retweet_potential - Total number of followers of given users.
	 *   avg_retweet_potential - Average number of followers of given users.
	 *
	 * @param users Users to process.
	 */
	this._processUsers = function(users) {
		var stats = {
			users: users,
			retweet_potential: 0,
			avg_retweet_potential: 0
		}
		
		for (var i = 0; i < users.length; i++) {
			stats.retweet_potential += users[i].followers_count;
		}
		
		if (users.length > 0) {
			stats.avg_retweet_potential = stats.retweet_potential / users.length;
		}
		
		return stats;
	};
	
	/**
	 * Processes a list of followers.
	 * @param followers Followers to process.
	 * @return A hash containing stats about the followers list.
	 * @see _processUsers
	 */
	this.processFollowers = function(followers) {
		var stats = this._processUsers(followers.users);
		stats.next_cursor = followers.next_cursor_str;
		var tweetalytc = this;
		var screen_name = this.screen_name;
		
		/**
		 * Requests for more followers to sample from.
		 * @param callback Function to be called after response has been returned.
		 *   The function is supposed to have a single boolean parameter than will
		 *   be set to true if new data has been added, and false otherwise.
		 */
		stats.more = function(callback) {
			var thisFollowers = this;
			var twitter = new Twitter();
			
			twitter.getFollowers(screen_name, function(followers) {
				if (typeof(followers.users.length) == "undefined") {
					thisFollowers.more = function(callback) { callback(false); };
					callback(false);
				}
				else {
					followers = tweetalytc.processFollowers(followers);
					thisFollowers.users = thisFollowers.users.concat(followers.users);
					thisFollowers.retweet_potential += followers.retweet_potential;
					thisFollowers.avg_retweet_potential = parseFloat(new Number(
						(Number(thisFollowers.avg_retweet_potential) + Number(followers.avg_retweet_potential)) / 2
					).toFixed(2));
					thisFollowers.nextCursor = followers.nextCursor;
					callback(true);
				}
			}, this.next_cursor);
		};
		
		return stats;
	}
	
	/**
	 * Processes a list of friends.
	 * @param friends Friends to process.
	 * @return A hash containing stats about the friends list.
	 * @see _processUsers
	 */
	this.processFriends = function(friends) {
		var stats = this._processUsers(friends);
		return stats;
	};
	
}
