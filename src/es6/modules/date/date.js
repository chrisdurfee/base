/**
 * This will add date functions to the base framework. 
 *  
 */ 
export const date = {  
	
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
	getDayName(day = new Date().getDate(), shortenName = false) 
	{ 
		let days = this.dayNames;
		if(day > days.length) 
		{ 
			return false; 
		}

		/* we want to check to shorten name */ 
		let dayName = days[day];
		return (shortenName)? dayName.substring(0, 3) : dayName; 
	},
	
	/**
	 * This will convert month to js. 
	 * 
	 * @param {int} month 
	 * @return {int}
	 */
	convertJsMonth(month)
	{
		return this.padNumber(month + 1); 
	}, 
	
	/**
	 * This will add leading zero to number less than 10. 
	 * 
	 * @param {int} number 
	 * @return {string}
	 */
	padNumber(number)
	{
		return (number <= 9)? '0' + number : String(number); 
	}, 
	
	/**
	 * This will format a date. 
	 * 
	 * @param {string} type 
	 * @param {string} dateString 
	 * @return {string}
	 */
	format(type, dateString)
	{
		let date = new Date(dateString); 
		switch(type)
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
	
	/**
	 * This will check for leap year. 
	 * 
	 * @param {int} year 
	 * @return {boolean}
	 */
	leapYear(year) 
	{ 
		return ((year % 400 === 0) || (year % 100 !== 0 && year % 4 === 0)); 
	}, 
	
	/**
	 * This will get a month name. 
	 * 
	 * @param {int} [month] 
	 * @param {boolean} [shortenName] 
	 * @return {string}
	 */
	getMonthName(month = new Date().getMonth(), shortenName = false) 
	{ 
		let months = this.monthNames;
		if(month > months.length) 
		{ 
			return false; 
		} 

		let monthName = months[month];
		return (shortenName)? monthName.substring(0, 3) : monthName; 
	}, 
	
	/**
	 * This will return the month length. 
	 * 
	 * @param {int} [month] 
	 * @param {int} [year] 
	 * @return {int}
	 */
	getMonthLength(month, year) 
	{ 
		/* we want to check to use params or use 
		default */ 
		let date = new Date(); 
		month = (typeof month !== 'undefined')? month : date.getMonth();
		year = (typeof year !== 'undefined')? year : date.getFullYear(); 
		
		/* we need to get the month lengths for 
		the year */ 
		let yearMonthLengths = this.getMonthsLength(year); 
		
		/* we can select the month length from 
		the yearMonthLengths array */ 
		let monthLength = yearMonthLengths[month]; 
		return monthLength; 
	}, 
	
	/**
	 * This will get the length of all the months. 
	 * 
	 * @param {int} year 
	 * @return {array}
	 */
	getMonthsLength(year = new Date().getFullYear()) 
	{ 
		let isLeapYear = this.leapYear(year); 
		let days = (isLeapYear === true)? 
			[31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] 
		:
			[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];  
		
		return days; 
	}, 
	
	/**
	 * This will convert to years. 
	 * 
	 * @param {int} milliseconds 
	 * @return {int}
	 */
	toYears(milliseconds) 
	{ 
		if(typeof milliseconds !== 'number') 
		{ 
			return false;
		} 
		
		return Math.floor(milliseconds / (1000 * 60 * 60 * 24 * 365.26));
	}, 
	
	/**
	 * This will convert to days. 
	 * 
	 * @param {int} milliseconds 
	 * @return {int}
	 */
	toDays(milliseconds) 
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
	toHours(milliseconds) 
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
	toMinutes(milliseconds) 
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
	toSeconds(milliseconds) 
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
	getDifference(startDate, endDate) 
	{ 
		/* we want to convert the dates to objects */ 
		let start = new Date(startDate), 
		end = new Date(endDate), 
		
		/* we want to subtract the start time from the end */ 
		difference = (end.getTime() - start.getTime()); 
		
		return { 
			years:  this.toYears(difference),  
			days:  this.toDays(difference), 
			hours:  this.toHours(difference), 
			minutes:  this.toMinutes(difference), 
			seconds:  this.toSeconds(difference) 
		};  
	}
};