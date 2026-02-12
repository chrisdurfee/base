import { Events } from "../../main/events/events.js";

/**
 * EventHelper
 *
 * This will create an event object to make
 * adding and removing events easier.
 *
 * @class
 */
export class EventHelper
{
	/**
	 * This will create an event helper.
	 *
	 * @constructor
	 */
	constructor()
	{
		/**
		 * @type {Array<object>} events
		 */
		this.events = [];
	}

	/**
	 * This will add an array of events.
	 *
	 * @param {Array<Array<any>>} events
	 * @returns {void}
	 */
	addEvents(events)
	{
		const length = events.length;
		if (length < 1)
		{
			return;
		}

		events.forEach((event) =>
		{
			/**
			 * @type {Array<any>} event
			 */
			// @ts-ignore
			this.on(...event);
		});
	}

	/**
	 * This will add an event.
	 *
	 * @param {string|Array<string>} event
	 * @param {object} obj
	 * @param {function} callBack
	 * @param {boolean} capture
	 * @returns {void}
	 */
	on(event, obj, callBack, capture)
	{
		Events.on(event, obj, callBack, capture);

		this.events.push({
			event,
			obj,
			callBack,
			capture
		});
	}

	/**
	 * This will remove an event.
	 *
	 * @param {string|Array<string>} event
	 * @param {object} obj
	 * @param {function} callBack
	 * @param {boolean} capture
	 * @returns {void}
	 */
	off(event, obj, callBack, capture)
	{
		Events.off(event, obj, callBack, capture);

		let option,
		events = this.events;
		for (var i = 0, length = events.length; i < length; i++)
		{
			option = events[i];
			// @ts-ignore
			if (option.event === event && option.obj === obj)
			{
				events.splice(i, 1);
				break;
			}
		}
	}

	/**
	 * This will set all events.
	 *
	 * @returns {void}
	 */
	set()
	{
		this.events.forEach((event) =>
		{
			// @ts-ignore
			Events.on(event.event, event.obj, event.callBack, event.capture);
		});
	}

	/**
	 * This will unset all events.
	 *
	 * @returns {void}
	 */
	unset()
	{
		this.events.forEach((event) =>
		{
			// @ts-ignore
			Events.off(event.event, event.obj, event.callBack, event.capture);
		});
	}

	/**
	 * This will reset the events.
	 *
	 * @returns {void}
	 */
	reset()
	{
		this.unset();
		this.events = [];
	}
}