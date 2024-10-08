
/**
 * This will add date functions to the base framework.
 *
 */
export const DateTime =
{
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
	 * @param {number} [day]
	 * @param {boolean} [shortenName=false]
	 * @returns {?string}
	 */
	getDayName(day = new Date().getDay(), shortenName = false)
	{
		const days = this.dayNames;
		if (day > days.length)
		{
			return null;
		}

		/* we want to check to shorten name */
		const dayName = days[day];
		return (shortenName)? dayName.substring(0, 3) : dayName;
	},

	/**
	 * This will convert month to js.
	 *
	 * @param {number} month
	 * @returns {string}
	 */
	convertJsMonth(month)
	{
		return this.padNumber(month + 1);
	},

	/**
	 * This will convert a date.
	 *
	 * @param {string} dateString
	 * @param {boolean} [addYear]
	 * @returns {string}
	 */
	convertDate(dateString, addYear = false)
	{
		dateString = (dateString)? dateString.replace(/\s/, 'T'): ''; //For safari

		const date = new Date(dateString),
		year = (addYear === true)? ' ' + date.getFullYear() : '';
		return this.getDayName(date.getDay()) + ', ' + this.getMonthName(date.getMonth(), true) + ' ' + this.padNumber(date.getDate()) + year;
	},

	/**
	 * This will add leading zero to number less than 10.
	 *
	 * @param {number} number
	 * @returns {string}
	 */
	padNumber(number)
	{
		return (number <= 9)? '0' + number : String(number);
	},

	/**
	 * This will create a new date object.
	 *
	 * @param {string} dateString
	 * @returns {Date}
	 */
	createDate(dateString)
	{
		if (!dateString)
		{
			return new Date();
		}

		if (typeof dateString === 'string' && dateString.indexOf('-') > -1)
		{
			dateString = dateString.replace(/\s/, 'T'); //For safari
			dateString = (dateString.indexOf(':') > -1)? dateString : dateString + "T00:00:00";
		}
		return new Date(dateString);
	},

	/**
	 * This will format a date.
	 *
	 * @param {string} formatType
	 * @param {string} dateString
	 * @returns {string}
	 */
	format(formatType, dateString)
	{
		const date = this.createDate(dateString);
		return this.renderDate(date.getFullYear(), date.getMonth() + 1, date.getDate(), formatType);
	},

	/**
	 * This will format time.
	 *
	 * @param {string} dateString
	 * @param {number} format
	 * @returns {string}
	 */
	formatTime(dateString, format)
	{
		const date = this.createDate(dateString);
		const formatType = (format === 24)? 'sql' : 'standard';

		return this.renderTime(date.getHours(), date.getMinutes(), date.getSeconds(), formatType);
	},

	/**
	 * This will get the meridian.
	 *
	 * @param {number|string} hours
	 * @returns {string}
	 */
	getMeridian(hours)
	{
		hours = Number(hours);
		return (hours >= 12)? 'PM' : 'AM';
	},

	/**
	 * This will convert 24 hour time to 12 hour time.
	 *
	 * @param {number|string} hours
	 * @returns {number}
	 */
	convert24To12(hours)
	{
		hours = Number(hours);
		if (hours > 12)
		{
			hours = hours - 12;
		}
		return hours;
	},

	/**
	 * This will convert 12 hour time to 24 hour time.
	 *
	 * @param {number|string} hours
	 * @param {string} meridian
	 * @returns {number}
	 */
	convert12To24(hours, meridian)
	{
		hours = Number(hours);
		if (meridian.toLowerCase() === 'pm')
		{
			hours = hours + 12;
		}
		return hours;
	},

	/**
	 * This will render a date.
	 *
	 * @param {number} year
	 * @param {number|string} month
	 * @param {number|string} day
	 * @param {string} [format='sql']
	 * @returns {string}
	 */
	renderDate(year, month, day, format = 'sql')
	{
		month = Number(month);
		day = Number(day);

		if (format === 'sql')
		{
			return `${year}-${this.padNumber(month)}-${this.padNumber(day)}`;
		}

		return `${this.padNumber(month)}/${this.padNumber(day)}/${year}`;
	},

	/**
	 * This will render time.
	 *
	 * @param {number} hours
	 * @param {number} minutes
	 * @param {number} [seconds=0]
	 * @param {string} [format='sql']
	 * @returns {string}
	 */
	renderTime(hours, minutes, seconds = 0, format = 'sql')
	{
		if (format === 'sql')
		{
			return `${this.padNumber(hours)}:${this.padNumber(minutes)}:${this.padNumber(seconds)}`;
		}

		const meridian = this.getMeridian(hours);
		hours = this.convert24To12(hours);

		return `${hours}:${this.padNumber(minutes)} ${meridian}`;
	},

	/**
	 * This will check for leap year.
	 *
	 * @param {number} year
	 * @returns {boolean}
	 */
	leapYear(year)
	{
		return ((year % 400 === 0) || (year % 100 !== 0 && year % 4 === 0));
	},

	/**
	 * This will get a month name.
	 *
	 * @param {number} [month]
	 * @param {boolean} [shortenName]
	 * @returns {string}
	 */
	getMonthName(month = new Date().getMonth(), shortenName = false)
	{
		const months = this.monthNames;
		if (month > months.length)
		{
			return '';
		}

		const monthName = months[month];
		if (!monthName)
		{
			return '';
		}
		return (shortenName)? monthName.substring(0, 3) : monthName;
	},

	/**
	 * This will return the month length.
	 *
	 * @param {number} [month]
	 * @param {number} [year]
	 * @returns {number}
	 */
	getMonthLength(month, year)
	{
		/* we want to check to use params or use
		default */
		const date = new Date();
		month = (typeof month !== 'undefined')? month : date.getMonth();
		year = (typeof year !== 'undefined')? year : date.getFullYear();

		/* we need to get the month lengths for
		the year */
		const yearMonthLengths = this.getMonthsLength(year);

		/* we can select the month length from
		the yearMonthLengths array */
		return yearMonthLengths[month];
	},

	/**
	 * This will get the length of all the months.
	 *
	 * @param {number} year
	 * @returns {array}
	 */
	getMonthsLength(year = new Date().getFullYear())
	{
		const isLeapYear = this.leapYear(year);
		const days = (isLeapYear === true)?
			[31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
		:
			[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

		return days;
	},

	/**
	 * This will get the local date.
	 *
	 * @param {string} remoteData
	 * @param {string} [remoteTimeZone]
	 * @returns {Date}
	 */
	getLocalDate(remoteData, remoteTimeZone = 'America/Denver')
	{
		let date = new Date(remoteData);

		if (Number.isNaN(date.getMonth()) === true)
		{
			const pattern = /[- :]/,
			values = remoteData.split(pattern);

			// @ts-ignore
			date = new Date(values[0], values[1] - 1, values[2], values[3], values[4], values[5]);
		}

		const invdate = new Date(Date.parse(date.toLocaleString('en-US', {
			timeZone: remoteTimeZone
		})));

		const diff = date.getTime() - invdate.getTime();
		return new Date(date.getTime() + diff);
	},

	/**
	 * This will convert a remote date to local time.
	 *
	 * @param {string} remoteData
	 * @param {boolean} sqlformat
	 * @param {boolean} timeOnly
	 * @param {string} [remoteTimeZone]
	 * @returns {string}
	 */
	getLocalTime(remoteData, sqlformat = false, timeOnly = false, remoteTimeZone = 'America/Denver')
	{
		if (!remoteData)
		{
			return '';
		}

		const date = this.getLocalDate(remoteData, remoteTimeZone);
		const month = date.getMonth() + 1;

		const format = (sqlformat) === true? 'sql' : 'standard';

		let formated = '';
		if (timeOnly === false)
		{
			formated += this.renderDate(date.getFullYear(), month, date.getDate(), format) + ' ';
		}
		return (formated + this.renderTime(date.getHours(), date.getMinutes(), date.getSeconds(), format));
	},

	/**
	 * This will get the difference from now.
	 *
	 * @param {string} date
	 * @param {boolean} [setHours]
	 * @returns {number}
	 */
	getDiffFromNow(date, setHours = false)
	{
		date = date.replace(/\s/, 'T'); //For safari
		const diffDate = new Date(date);

		const now = new Date();
		if (setHours === true)
		{
			now.setHours(0,0,0,0);
		}

		let timeDiff = now.getTime() - diffDate.getTime();
		return timeDiff;
	},

	/**
	 * This will get the age.
	 *
	 * @param {string} date
	 * @returns {string}
	 */
	getAge(date)
	{
		const milliseconds = this.getDiffFromNow(date);

		let age,
		days;
		switch(true)
		{
			case milliseconds < 86400000:
				age = '1 day';
				break;
			case milliseconds < 604800000:
				days = this.toDays(milliseconds);
				age = (days) + ' days';
				break;
			case milliseconds < 1209600000:
				age = '1 week';
				break;
			case milliseconds < 2592000000:
				days = this.toDays(milliseconds);
				var weeks = Math.floor(days / 7);
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

		return String(age);
	},

	/**
	 * This will get the time frame.
	 *
	 * @param {string} date
	 * @returns {string}
	 */
	getTimeFrame(date)
	{
		const timeDiff = this.getDiffFromNow(date);
		return this.convertToEstimate(timeDiff);
	},

	/**
	 *
	 * @param {number} milliseconds
	 * @returns {string}
	 */
	convertToEstimate(milliseconds)
	{
		let timeFrame = '';
		let days, weeks, years, months, hours, minutes, seconds;

		if (milliseconds <= 0)
		{
			switch (true)
			{
				case milliseconds < -63072000000:
					years = this.toYears(Math.abs(milliseconds));
					timeFrame = 'in ' + years + ' years';
					break;
				case milliseconds < -31536000000:
					timeFrame = 'in a year';
					break;
				case milliseconds < -5184000000:
					months = this.toMonths(Math.abs(milliseconds));
					timeFrame = 'in ' + months + ' months';
					break;
				case milliseconds < -2592000000:
					timeFrame = 'in a month';
					break;
				case milliseconds < -1209600000:
					days = this.toDays(Math.abs(milliseconds)),
					weeks = Math.floor(days / 7);
					timeFrame = 'in ' + weeks + ' weeks';
					break;
				case milliseconds < -604800000:
					timeFrame = 'in a week';
					break;
				case milliseconds < -172800000:
					days = this.toDays(Math.abs(milliseconds));
					timeFrame = 'in ' + (days) + ' days';
					break;
				case milliseconds < -86400000:
					timeFrame = 'tomorrow';
					break;
				case milliseconds < -7200000:
					hours = this.toHours(Math.abs(milliseconds));
					timeFrame = 'in ' + hours + ' hours';
					break;
				case milliseconds <= -3600000:
					timeFrame = 'in an hour';
					break;
				case milliseconds < -120000:
					minutes = this.toMinutes(Math.abs(milliseconds));
					timeFrame = 'in ' + minutes + ' minutes';
					break;
				case milliseconds < -60000:
					timeFrame = 'in a minute';
					break;
				case milliseconds < -2000:
					seconds = this.toSeconds(Math.abs(milliseconds));
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
			switch (true)
			{
				case milliseconds < 1000:
					timeFrame = '1 second ago';
					break;
				case milliseconds < 60000:
					seconds = this.toSeconds(milliseconds);
					timeFrame = seconds + ' seconds ago';
					break;
				case milliseconds < 120000:
					timeFrame = '1 minute ago';
					break;
				case milliseconds < 3600000:
					minutes = this.toMinutes(milliseconds);
					timeFrame = minutes + ' minutes ago';
					break;
				case milliseconds < 7200000:
					timeFrame = '1 hour ago';
					break;
				case milliseconds < 86400000:
					hours = this.toHours(milliseconds);
					timeFrame = hours + ' hours ago';
					break;
				case milliseconds < 172800000:
					timeFrame = 'yesterday';
					break;
				case milliseconds < 604800000:
					days = this.toDays(milliseconds);
					timeFrame = (days) + ' days ago';
					break;
				case milliseconds < 1209600000:
					timeFrame = 'a week ago';
					break;
				case milliseconds < 2592000000:
					days = this.toDays(milliseconds),
					weeks = Math.floor(days / 7);
					timeFrame = weeks + ' weeks ago';
					break;
				case milliseconds < 5184000000:
					timeFrame = 'a month ago';
					break;
				case milliseconds < 31536000000:
					months = this.toMonths(milliseconds);
					timeFrame = months + ' months ago';
					break;
				case milliseconds < 63072000000:
					timeFrame = 'a year ago';
					break;
				default:
					years = this.toYears(milliseconds);
					timeFrame = years + ' years ago';
			}
		}

		return timeFrame;
	},

	/**
	 * This will convert to years.
	 *
	 * @param {number} milliseconds
	 * @returns {number}
	 */
	toYears(milliseconds)
	{
		if (typeof milliseconds !== 'number')
		{
			return 0;
		}

		return Math.floor(milliseconds / (1000 * 60 * 60 * 24 * 365.26));
	},

	/**
	 * This will convert to months.
	 *
	 * @param {number} milliseconds
	 * @returns {number}
	 */
	toMonths(milliseconds)
	{
		if (typeof milliseconds === 'number')
		{
			return Math.floor(milliseconds / (1000 * 60 * 60 * 24 * 30));
		}
		return 0;
	},

	/**
	 * This will convert to days.
	 *
	 * @param {number} milliseconds
	 * @returns {number}
	 */
	toDays(milliseconds)
	{
		if (typeof milliseconds !== 'number')
		{
			return 0;
		}

		return Math.floor(milliseconds / (60 * 60 * 1000 * 24) * 1);
	},

	/**
	 * This will convert to hours.
	 *
	 * @param {number} milliseconds
	 * @returns {number}
	 */
	toHours(milliseconds)
	{
		if (typeof milliseconds !== 'number')
		{
			return 0;
		}

		return Math.floor((milliseconds % (60 * 60 * 1000 * 24)) / (60 * 60 * 1000) * 1);
	},

	/**
	 * This will convert to minutes.
	 *
	 * @param {number} milliseconds
	 * @returns {number}
	 */
	toMinutes(milliseconds)
	{
		if (typeof milliseconds !== 'number')
		{
			return 0;
		}

		return Math.floor(((milliseconds % (60 * 60 * 1000 * 24)) % (60 * 60 * 1000)) / (60 * 1000) * 1);
	},

	/**
	 * This will convert to seconds.
	 *
	 * @param {number} milliseconds
	 * @returns {number}
	 */
	toSeconds(milliseconds)
	{
		if (typeof milliseconds !== 'number')
		{
			return 0;
		}

		return Math.floor((((milliseconds % (60 * 60 * 1000 * 24)) % (60 * 60 * 1000)) % (60 * 1000)) / 1000 * 1);
	},

	/**
	 * This will get the difference between two dates.
	 *
	 * @param {string} startDate
	 * @param {string} endDate
	 * @returns {object}
	 */
	getDifference(startDate, endDate)
	{
		/* we want to convert the dates to objects */
		const start = new Date(startDate),
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