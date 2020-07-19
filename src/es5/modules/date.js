/* base framework module */ 
/* 
	date and time 
*/ 
(function() 
{
	"use strict"; 
	
	/**
	 * This will add date functions to the base framework. 
	 *  
	 */ 
	base.extend.date = {  
		
		/**
		 * @member {array} monthName
		 */ 
		monthNames: ["January","February","March","April","May","June","July","August","September","October","November","December"], 
		
		/**
		 * @member {array} dayNames
		 */ 
		dayNames: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], 
		
		/**
		 * This will get the day name. 
		 * 
		 * @param {int} [day] 
		 * @param {boolean} [shortenName=false] 
		 * @return {string}
		 */
		getDayName: function(day, shortenName) 
		{ 
			day = (typeof day !== 'undefined')? day : new Date().getDate(); 
			
			var dayName = false;  
			var days = this.dayNames;
			if(day < days.length) 
			{ 
				/* we want to check to shorten name */ 
				dayName = (shortenName)? days[day].substring(0, 3) : days[day]; 
			}
			return dayName; 
		},
		
		/**
		 * This will convert month to js. 
		 * 
		 * @param {int} month 
		 * @return {int}
		 */
		convertJsMonth: function(month)
		{
			return this.padNumber(month + 1); 
		}, 
		
		/**
		 * This will add leading zero to number less than 10. 
		 * 
		 * @param {int} number 
		 * @return {string}
		 */
		padNumber: function(number)
		{
			return (number <= 9)? '0' + number : String(number); 
		},
		
		createDate: function(dateString)
		{
			if(typeof dateString !== 'string')
			{
				return new Date();
			}

			if(dateString.indexOf('-') > -1)
			{
				dateString = dateString.replace(/\s/, 'T'); //For safari
			}
			return new Date(dateString);
		},

		format: function(format, dateString)
		{
			var date = this.createDate(dateString);
			switch(format)
			{
				case 'sql':
					dateString = date.getFullYear() + '-' + this.convertJsMonth(date.getMonth()) + '-' + this.padNumber(date.getDate());
					break;
				default:
					dateString = this.convertJsMonth(date.getMonth()) + '/' + this.padNumber(date.getDate()) + '/' + date.getFullYear();
					break;

			}
			return dateString;
		},

		formatTime: function(dateString, format)
		{
			if(!dateString)
			{
				return '';
			}
			
			var date = this.createDate(dateString);

			if(format === 12)
			{
				return date.getHours() + ':' + this.padNumber(date.getMinutes()) + '-' + this.padNumber(date.getSeconds());
			}

			var hours = date.getHours(),
			meridian = 'AM';

			if(hours > 12)
			{
				meridian = 'PM';
				hours = hours - 12;
			}
			return (hours + ':' + this.padNumber(date.getMinutes()) + ' ' + meridian);
		}, 
		
		/**
		 * This will check for leap year. 
		 * 
		 * @param {int} year 
		 * @return {boolean}
		 */
		leapYear: function(year) 
		{ 
			var leapYear = false; 
			
			if((year % 400 === 0) || (year % 100 !== 0 && year % 4 === 0))
			{ 
				leapYear = true;
			} 
			return leapYear; 
		}, 
		
		/**
		 * This will get a month name. 
		 * 
		 * @param {int} [month] 
		 * @param {boolean} [shortenName] 
		 * @return {string}
		 */
		getMonthName: function(month, shortenName) 
		{ 
			month = (typeof month !== 'undefined')? month : new Date().getMonth(); 
			
			var monthName = false; 
			var months = this.monthNames;
			if(month < months.length) 
			{ 
				/* we want to check to shorten name */ 
				monthName = (shortenName)? months[month].substring(0, 3) : months[month]; 
			} 
			return monthName; 
		}, 
		
		/**
		 * This will return the month length. 
		 * 
		 * @param {int} [month] 
		 * @param {int} [year] 
		 * @return {int}
		 */
		getMonthLength: function(month, year) 
		{ 
			/* we want to check to use params or use 
			default */ 
			var date = new Date(); 
			month = (typeof month !== 'undefined')? month : date.getMonth();
			year = (typeof year !== 'undefined')? year : date.getFullYear(); 
			
			/* we need to get the month lengths for 
			the year */ 
			var yearMonthLengths = this.getMonthsLength(year); 
			
			/* we can select the month length from 
			the yearMonthLengths array */ 
			var monthLength = yearMonthLengths[month]; 
			return monthLength; 
		}, 
		
		/**
		 * This will get the length of all the months. 
		 * 
		 * @param {int} year 
		 * @return {array}
		 */
		getMonthsLength: function(year) 
		{ 
			year = (typeof year !== 'undefined')? year : new Date().getFullYear();
			
			/* we needto check if the year is a leap year */ 
			var isLeapYear = this.leapYear(year); 
			var days = (isLeapYear === true)? 
				[31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] 
			:
				[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];  
			
			return days; 
		}, 

		/**
		 * This will get the milliseconds from a date until now. 
		 * 
		 * @param {string} date 
		 * @return {int}
		 */
		getDiffFromNow: function(date)
		{
			date = date.replace(/\s/, 'T') //For safari
			date = new Date(date);

			var now = new Date(),
			timeDiff = now.getTime() - date.getTime();
			return timeDiff;
		},

		/**
		 * This will get the age from a date until now. 
		 * 
		 * @param {string} date 
		 * @return {(string|int)}
		 */
		getAge: function(date)
		{
			var milliseconds = this.getDiffFromNow(date);

			var age = '';
			switch(true)
			{
				case milliseconds < 86400000:
					age = '1 day';
					break;
				case milliseconds < 604800000: 
					var days = this.toDays(milliseconds);
					age = (days) + ' days';
					break;
				case milliseconds < 1209600000: 
					age = '1 week';
					break;
				case milliseconds < 2592000000: 
					var days = this.toDays(milliseconds),
					weeks = Math.floor(days / 7);
					age = weeks + ' weeks';
					break;
				case milliseconds < 5184000000: 
					age = '1 month';
					break;
				case milliseconds < 31104000000: 
					var months = this.toMonths(milliseconds);
					age = months + ' months';
					break;
				default:
					var years = this.toYears(milliseconds);
					age = years;
			}

			return age;
		},

		/**
		 * This will get the timeframe for a date. 
		 * 
		 * @param {string} date 
		 * @return {string}
		 */
		getTimeFrame: function(date)
		{
			var timeDiff = this.getDiffFromNow(date);
			return this.convertToEstimate(timeDiff);
		},

		/**
		 * This will get the timeframe from milliseconds.
		 * 
		 * @param {int} milliseconds 
		 * @return {string}
		 */
		convertToEstimate: function(milliseconds)
		{
			var timeFrame = '';

			if(milliseconds <= 0)
			{
				switch(true)
				{
					case milliseconds < -63072000000:
						var years = this.toYears(Math.abs(milliseconds));
						timeFrame = 'in ' + years + ' years';
						break;
					case milliseconds < -31536000000:
						timeFrame = 'in a year';
						break;
					case milliseconds < -5184000000:
						var months = this.toMonths(Math.abs(milliseconds));
						timeFrame = 'in ' + months + ' months';
						break;
					case milliseconds < -2592000000:
						timeFrame = 'in a month';
						break;
					case milliseconds < -1209600000:
						var days = this.toDays(Math.abs(milliseconds)),
						weeks = Math.floor(days / 7);
						timeFrame = 'in ' + weeks + ' weeks';
						break;
					case milliseconds < -604800000:
						timeFrame = 'in a week';
						break;
					case milliseconds < -172800000:
						var days = this.toDays(Math.abs(milliseconds));
						timeFrame = 'in ' + (days) + ' days';
						break;
					case milliseconds < -86400000:
						timeFrame = 'in a day';
						break;
					case milliseconds < -7200000:
						var hours = this.toHours(Math.abs(milliseconds));
						timeFrame = 'in ' + hours + ' hours';
						break;
					case milliseconds <= -3600000:
						timeFrame = 'in an hour';
						break;
					case milliseconds < -120000:
						var minutes = this.toMinutes(Math.abs(milliseconds));
						timeFrame = 'in ' + minutes + ' minutes';
						break;
					case milliseconds < -60000:
						timeFrame = 'in a minute';
						break;
					case milliseconds < -2000:
						var seconds = this.toSeconds(Math.abs(milliseconds));
						timeFrame = 'in ' + seconds + ' seconds';
						break;
					case milliseconds < -1:
						timeFrame = 'in 1 second';
						break;
					default:
						timeFrame = 'now';
				}
			}
			else
			{
				switch(true)
				{
					case milliseconds < 1000:
						timeFrame = '1 second ago';
						break;
					case milliseconds < 60000:
						var seconds = this.toSeconds(milliseconds);
						timeFrame = seconds + ' seconds ago';
						break;
					case milliseconds < 120000:
						timeFrame = '1 minute ago';
						break;
					case milliseconds < 3600000:
						var minutes = this.toMinutes(milliseconds);
						timeFrame = minutes + ' minutes ago';
						break;
					case milliseconds < 7200000:
						timeFrame = '1 hour ago';
						break;
					case milliseconds < 86400000:
						var hours = this.toHours(milliseconds);
						timeFrame = hours + ' hours ago';
						break;
					case milliseconds < 172800000:
						timeFrame = 'yesterday';
						break;
					case milliseconds < 604800000:
						var days = this.toDays(milliseconds);
						timeFrame = (days) + ' days ago';
						break;
					case milliseconds < 1209600000:
						timeFrame = 'a week ago';
						break;
					case milliseconds < 2592000000:
						var days = this.toDays(milliseconds),
						weeks = Math.floor(days / 7);
						timeFrame = weeks + ' weeks ago';
						break;
					case milliseconds < 5184000000:
						timeFrame = 'a month ago';
						break;
					case milliseconds < 31536000000:
						var months = this.toMonths(milliseconds);
						timeFrame = months + ' months ago';
						break;
					case milliseconds < 63072000000:
						timeFrame = 'a year ago';
						break;
					default:
						var years = this.toYears(milliseconds);
						timeFrame = years + ' years ago';
				}
			}

			return timeFrame;
		},
		
		/**
		 * This will convert to years. 
		 * 
		 * @param {int} milliseconds 
		 * @return {int}
		 */
		toYears: function(milliseconds) 
		{ 
			if(typeof milliseconds !== 'number') 
			{ 
				return false;
			} 
			
			return Math.floor(milliseconds / (1000 * 60 * 60 * 24 * 365.26));
		}, 

		/**
		 * This will convert to months. 
		 * 
		 * @param {int} milliseconds 
		 * @return {int}
		 */
		toMonths: function(milliseconds) 
		{ 
			if(typeof milliseconds === 'number') 
			{ 
				return Math.floor(milliseconds / (1000 * 60 * 60 * 24 * 30)); 
			} 
			return false; 
		},
		
		/**
		 * This will convert to days. 
		 * 
		 * @param {int} milliseconds 
		 * @return {int}
		 */
		toDays: function(milliseconds) 
		{ 
			if(typeof milliseconds !== 'number') 
			{ 
				return false;
			}
			
			return Math.floor(milliseconds / (60 * 60 * 1000 * 24) * 1);  
		}, 
		
		/**
		 * This will convert to hours. 
		 * 
		 * @param {int} milliseconds 
		 * @return {int}
		 */
		toHours: function(milliseconds) 
		{ 
			if(typeof milliseconds !== 'number') 
			{ 
				return false;
			} 
				
			return Math.floor((milliseconds % (60 * 60 * 1000 * 24)) / (60 * 60 * 1000) * 1);  
		}, 
		
		/**
		 * This will convert to minutes. 
		 * 
		 * @param {int} milliseconds 
		 * @return {int}
		 */
		toMinutes: function(milliseconds) 
		{ 
			if(typeof milliseconds !== 'number') 
			{ 
				return false;
			}
			
			return Math.floor(((milliseconds % (60 * 60 * 1000 * 24)) % (60 * 60 * 1000)) / (60 * 1000) * 1);  
		}, 
		
		/**
		 * This will convert to seconds. 
		 * 
		 * @param {int} milliseconds 
		 * @return {int}
		 */
		toSeconds: function(milliseconds) 
		{ 
			if(typeof milliseconds !== 'number') 
			{ 
				return false;
			}
			
			return Math.floor((((milliseconds % (60 * 60 * 1000 * 24)) % (60 * 60 * 1000)) % (60 * 1000)) / 1000 * 1);  
		},
		
		/**
		 * This will get the difference between two dates. 
		 * 
		 * @param {string} startDate 
		 * @param {string} endDate 
		 * @return {object}
		 */
		getDifference: function(startDate, endDate) 
		{ 
			/* we want to convert the dates to objects */ 
			var start = new Date(startDate), 
			end = new Date(endDate); 
			
			/* we want to subtract the start time from the end */ 
			var difference = (end.getTime() - start.getTime()); 
			
			return { 
				years:  this.toYears(difference),  
				days:  this.toDays(difference), 
				hours:  this.toHours(difference), 
				minutes:  this.toMinutes(difference), 
				seconds:  this.toSeconds(difference) 
			};  
		}
	}; 
})();