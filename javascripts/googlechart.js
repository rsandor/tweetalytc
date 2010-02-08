/**
 * Helper class for creating google charts using information gathered from the Tweetalytc engine.
 * @author Ryan Sandor Richards.
 * @copyright 2010 Ryan Sandor Richards
 */
function GoogleChart() {
	this.baseURL = 'http://chart.apis.google.com/chart?';
	this.params = {
		'cht': 'lc',
		'chs': '300x200'
	};
	this.dataSets = []; // chd
	this.axisLabels = {}; // chxt & chxl
	this.axisPositions = {}; // chxp
	this.markers = []; 	// chm
	

	/**
	 * Encodes a data set using simple encoding.
	 * @param set Data set to encode.
	 * @return Encoded set.
	 */
	this.simpleEncode = function(set) {
		var min = null, max = 0;
		for (var j = 0; j < set.length; j++) {
			if (max < parseFloat(set[j])) {max = parseFloat(set[j]);}
			if (min == null || min > parseFloat(set[j])) {min = parseFloat(set[j]);}
		}
		
		var c = 61/(max-min);
		var s = "s:";
		for (var k in set) { 
			s += GoogleChart.SIMPLE_ENCODE[61*(set[k]-min)/(max-min) | 0];	
		}
		return s;
	}
	
	/**
	 * Evaluates the URL for the chart.
	 * @return The image URL for the chart.
	 */
	this.getURL = function() {
		var url = this.baseURL;
		
		// Add flat parameters
		for (var k in this.params) {
			url += '&' + k + '=' + escape(this.params[k]);
		}
		
		// Add datasets
		var sets = [];
		for (var i in this.dataSets) {
 			sets.push(this.simpleEncode(this.dataSets[i]));
		}
		url += '&chd=' + sets.join('|');
		
		// Add axis labels and positions
		var axes = [];
		var labels = [];
		var positions = [];
		var count = 0;
		for (var axis in this.axisLabels) {
			axes.push(axis);
			labels.push(count + ":|" + this.axisLabels[axis].join('|'));
			if (this.axisPositions[axis] != null) {
				positions.push(count + "," + this.axisPositions[axis].join(','));
			}
			count++;
		}
		
		if (axes.length > 0) {
			url += '&chxt=' + axes.join(',');
			url += '&chxl=' + labels.join('|');
		}
		
		if (positions.length > 0) {
			url += '&chxp=' + positions.join('|');
		}
		
		// Chart markers
		url += '&chm=' + this.markers.join('|');
		
		return url;
	}
	
	/**
	 * Adds a dataset to the chart.
	 * @param data Dataset to add.
	 */
	this.addDataSet = function(data) {
		this.dataSets.push(data);
	};
	
	/**
	 * Removes a dataset with the given index.
	 * @return The data represented in the removed set.
	 * @throws Exception if index < 0 or >= the number of datasets.
	 */
	this.removeDataSet = function(index) {
		if (index < 0 || index >= this.dataSets.length) {
			throw "Dataset index out of bounds!";
		}
		return this.dataSets.splice(index, 1);		
	};
	
	/**
	 * Removes all datasets currently in the chart.
	 */
	this.clearDataSets = function() {
		this.dataSets = [];
	};
	
	/**
	 * Adds labels to an axis on the chart.
	 * @param axis The axis for the labels (can be: x, y, r, or t).
	 * @param labels Labels for the axis.
	 * @param (optional) Positions for the labels along the axis.
	 */
	this.addAxisLabels = function(axis, labels, positions) {
		this.axisLabels[axis] = labels;
		if (positions != null) {
			this.axisPositions[axis] = positions;
		}
	}
	
	/**
	 * Sets the type of the chart.
	 * @param type The type of the chart, see the chart type constants below.
	 */
	this.setChartType = function(type) {
		this.params['cht'] = type;
	};
	
	/**
	 * Sets the size of the chart.
	 * @param width Width for the chart image.
	 * @param height Height for the chart image.
	 * @throws Exception if the width or height exceeds 1,000 pixels or the total
	 *   number of pixels exceeds 300,000.
	 */
	this.setChartSize = function(width, height) {
		if (width > 1000) {
			throw "Chart width cannot exceed 1000 pixels";
		}
		if (height > 1000) {
			throw "Chart height cannot exceed 1000 pixels";
		}
		if (width * height > 300000) {
			throw "Total number of pixels cannot exceed 300,000"
		}
		this.params['chs'] = width + "x" + height;
	};
	
	/**
	 * Sets the color for the chart.
	 * @param c Six hexidecimal digit color representation.
	 */
	this.setChartColor = function(c) {
		this.params['chco'] = c;
	};
	
	/**
	 * Adds a chart market style for the chart.
	 * @param type (default: GoogleChart.MARKER_SQUARE) Type of the chart marker (see constants below).
	 * @param color (default: '000000') Marker color (in six hexidecimal digit format).
	 * @param datasetIndex (default: 0) Index of the dataset for which to mark.
	 * @param dataPoint (default: GoogleChart.ALL_DATA_POINTS) The data point for which to draw the marker.
	 * @param size (default: 5) Size of the marker in pixels.
	 * @param priority (default: GoogleChart.MARKERS_NORMAL) When the marker(s) are drawn (see constants below).
	 */
	this.addChartMarker = function(type, color, datasetIndex, dataPoint, size, priority) {
		if (type == null) { type = 's'; }
		if (color == null) { color = '000000'; }
		if (datasetIndex == null) { datasetIndex = 0; }
		if (dataPoint == null) { dataPoint = -1; }
		if (size == null) { size = '5.0'; }
		if (priority == null) { priority = 0; }
		var markerAry = [type, color, datasetIndex, dataPoint, size, priority];
		this.markers.push(markerAry.join(','));
	};
	
	/** 
	 * Adds a new range marker to the chart.
	 * @param type Either GoogleChart.RANGE_HORIZONTAL or GoogleChart.RANGE_VERTICAL.
	 * @param color Marker color (in six hexidecimal digit format). 
	 * @param start Start position for the range marker.
	 * @param end End position for the range marker.
	 */
	this.addRangeMarker = function(type, color, start, end) {
		var markerAry = [type, color, 0, start, end];
		this.markers.push(markerAry.join(','));
	};
	
	/**
	 * Clears all chart markers associated with the chart.
	 */
	this.clearChartMarkers = function() {
		this.markers = [];
	};
	
	/**
	 * Sets the data scaling for the chart.
	 * @param min Minimum value for the chart.
	 * @param max Maximum value for the chart.
	 */
	this.setDataScaling = function(min, max) {
		this.params['chds'] = [min, max].join(',');
	};
	
	/**
	 * Helper function for construcing date labels.
	 * @param days A list of days.
	 * @param i Index in the list for which to construct the label.
	 * @return A label formatted as "MM/DD", "M/DD", "MM/D", or "M/D"
	 */
	this.dayLabel = function(days, i) {
		return (days[i].date.getMonth()+1)+'/'+days[i].date.getDate();
	}
}

GoogleChart.SIMPLE_ENCODE = [
	'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
	'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
	'0','1','2','3','4','5','6','7','8','9'
];

/**
 * Chart type constants.
 */
GoogleChart.LINE = 'lc';

/**
 * Chart marker type constants.
 */
GoogleChart.ARROW = 'a';
GoogleChart.CROSS = 'c';
GoogleChart.DIAMOND = 'd';
GoogleChart.CIRCLE = 'o';
GoogleChart.SQUARE = 's';
GoogleChart.X = 'x';
GoogleChart.VERTICAL = 'v';
GoogleChart.VERTICAL_CHART = 'V';
GoogleChart.HORIZONTAL = 'h';
GoogleChart.RANGE_HORIZONTAL = 'r';
GoogleChart.RANGE_VERTICAL = 'R';

/**
 * Used to mark all data points.
 */
GoogleChart.ALL_DATA_POINTS = -1;

/**
 * Chart marker drawing priority constants.
 */
GoogleChart.MARKERS_BEFORE = -1;
GoogleChart.MARKERS_NORMAL = 0;
GoogleChart.MARKERS_AFTER = 1;

/**
 * Timeline charting frequency constants. These determine how data points are
 * distributed. For instance if choosing Chart.HOURLY then each data point would
 * represent compiled data from a given hour.
 */
GoogleChart.HOURLY = 0;
GoogleChart.DAILY = 1;
GoogleChart.WEEKLY = 2;

/**
 * Static helper function for creating charts based on timeline results returned
 * from the Tweetalytc statistics engine.
 * @param stats Processed timeline statistics.
 * @param metric (Default: statuses) Metric for the chart (statuses, tweet_length, velocity).
 * @param dataPoints (Default: 10) Total number of sample data points to display. 
 * @parma frequency (Default: GoogleChart.DAILY) How often to sample data points.
 * @return A GoogleChart object representing the chart.
 */
GoogleChart.timelineChart = function(stats, metric, dataPoints, frequency) {
	if (metric != 'statuses' && metric != 'tweet_length' && metric != 'velocity') {
		metric = 'statuses';
	}
	if (dataPoints == null) {	dataPoints = 5; }
	if (frequency == null) { frequency = GoogleChart.DAILY;	}
	
	var chart = new GoogleChart();
	var dataSet = [];
	var labels = [];
	var max = 0;
	var min = null;
	var maxLabels = 5;
	
	// Construct dataset for the chart.
	if (frequency == GoogleChart.DAILY) {
		for (var i = 0; i < stats.days.length; i++) {
			if (dataPoints == 0) { break; }
			dataPoints--;
			
			var count;
			if (metric == 'statuses') {
				count = stats.days[i].statuses.length;
			}
			else if (metric == 'tweet_length') {
				count = stats.days[i].average_status_length;
			}
			else if (metric == 'velocity') {
				count = stats.days[i].velocity;
			}
			
			if (count > max) { max = parseFloat(count); }
			if (min == null || count < min) { min = parseFloat(count); }
			
			dataSet.push(count);
		}
		
		// Ensure an odd number of data points
		if (dataSet.length % 2 == 0 && dataSet.length > maxLabels) {
			dataSet.pop();
		}
		
		dataSet.reverse();
	}
	chart.addDataSet(dataSet);
	
	// Construct x-axis labels for the chart
	var numDays = dataSet.length;
	if (numDays <= maxLabels) {
		for (var i = numDays; i > 0; i--) {
			labels.push(chart.dayLabel(stats.days, i-1));
		}
	}
	else {
		var set = [0, parseInt(numDays/2), numDays];
		var toAdd = [];
		
		for (var i = 0; i < set.length-1; i++)
			toAdd.push(parseInt(Math.floor((set[i+1] - 1) - (set[i] + 1)/2)));
		for (var k = 0; k < toAdd.length; k++)
			set.push(toAdd[k]);
		set.sort(function(a,b) { return a-b; });
		
		for (var k = set.length; k > 0; k--) {
			labels.push( chart.dayLabel(stats.days, set[k-1]) );
		}
	}	

	// Construct y-axis labels for the chart
	min = parseFloat(min);
	max = parseFloat(max);
	var yLabels = [
		new Number(min).toFixed(0),
		new Number(min + (max-min) / 4).toFixed(0),
		new Number(min + (max-min) / 2).toFixed(0),
		new Number(min + 3*(max-min) / 4).toFixed(0),
		new Number(max).toFixed(0)
	];
	
	// Label and style the chart
	chart.addAxisLabels('x', labels);
	chart.addAxisLabels('y', yLabels);
	chart.setDataScaling(min, max);
	chart.setChartColor('777777');
	
	if (dataSet.length <= 20) {
		chart.addChartMarker(GoogleChart.CIRCLE, '000099', 0, -1, 5);
	}
	
	if (min < 0) {
		chart.addRangeMarker(GoogleChart.RANGE_HORIZONTAL, 'BBBBBB', .49, .50);
	}

	// Return the chart :)
	return chart;
}