import { base } from '../../main/base.js';

/**
 * EventHelper
 *
 * This will create an event object to make
 * adding and removing events easier.
 * @class
 */
export class EventHelper
{
	/**
	 * @constructor
	 */
	constructor()
	{
		this.events = [];
	}

	/**
	 * This will add an array of events.
	 *
	 * @param {array} events
	 */
	addEvents(events)
	{
		const length = events.length;
		if (length < 1)
		{
			return false;
		}

		let event;
		for (var i = 0; i < length; i++)
		{
			event = events[i];
			this.on(...event);
		}
	}

	/**
	 * This will add an event.
	 *
	 * @param {string} event
	 * @param {object} obj
	 * @param {function} callBack
	 * @param {boolean} capture
	 */
	on(event, obj, callBack, capture)
	{
		base.on(event, obj, callBack, capture);

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
	 * @param {string} event
	 * @param {object} obj
	 * @param {function} callBack
	 * @param {boolean} capture
	 */
	off(event, obj, callBack, capture)
	{
		base.off(event, obj, callBack, capture);

		let option,
		events = this.events;
		for (var i = 0, length = events.length; i < length; i++)
		{
			option = events[i];
			if (option.event === event && option.obj === obj)
			{
				events.splice(i, 1);
				break;
			}
		}
	}

	/**
	 * This will set all events.
	 */
	set()
	{
		let event,
		events = this.events;
		for (var i = 0, length = events.length; i < length; i++)
		{
			event = events[i];
			base.on(event.event, event.obj, event.callBack, event.capture);
		}
	}

	unset()
	{
		let event,
		events = this.events;
		for (var i = 0, length = events.length; i < length; i++)
		{
			event = events[i];
			base.off(event.event, event.obj, event.callBack, event.capture);
		}
	}

	/**
	 * This will reset the events.
	 */
	reset()
	{
		this.unset();
		this.events = [];
	}
}