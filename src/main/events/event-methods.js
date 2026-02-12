import { Types } from '../../shared/types.js';
import { Events } from './events.js';

/**
 * This will create an object that can be added to base to
 * add event methods.
 */
export const EventMethods =
{
	/**
	 * @type {Events} events
	 */
	events: Events,

	/**
	 * This will add an event to an object.
	 *
	 * @param {string} event The event name.
	 * @param {object} obj
	 * @param {function} fn
	 * @param {boolean|object} [capture]
	 * @returns {object}
	 */
	addListener(event, obj, fn, capture)
	{
		this.events.add(event, obj, fn, capture);

		return this;
	},

	/**
	 * This will add an event to an object.
	 *
	 * @param {string|array} event The event name.
	 * @param {object} obj
	 * @param {function} fn
	 * @param {boolean|object} [capture]
	 * @returns {object}
	 */
	on(event, obj, fn, capture)
	{
		const events = this.events;
		if (Array.isArray(event))
		{
			event.forEach((evt) =>
			{
				events.add(evt, obj, fn, capture);
			});
		}
		else
		{
			events.add(event, obj, fn, capture);
		}
		return this;
	},

	/**
	 * This will remove an event from an object.
	 *
	 * @param {string|array} event The event name.
	 * @param {object} obj
	 * @param {function} fn
	 * @param {boolean|object} [capture]
	 * @returns {object}
	 */
	off(event, obj, fn, capture)
	{
		const events = this.events;
		if (Array.isArray(event))
		{
			event.forEach((evt) =>
			{
				events.remove(evt, obj, fn, capture);
			});
		}
		else
		{
			events.remove(event, obj, fn, capture);
		}
		return this;
	},

	/**
	 * This will remove an event from an object.
	 *
	 * @param {string} event The event name.
	 * @param {object} obj
	 * @param {function} fn
	 * @param {boolean|object} [capture]
	 * @returns {object}
	 */
	removeListener(event, obj, fn, capture)
	{
		/* we want to remove this from the active events */
		this.events.remove(event, obj, fn, capture);

		return this;
	},

	/**
	 * This will create a custom event.
	 *
	 * @protected
	 * @param {object} event
	 * @param {string} eventType
	 * @param {object} [settings]
	 * @param {object} [params]
	 * @returns {object}
	 */
	_createEvent(event, eventType, settings, params)
	{
		let e;
		switch (eventType)
		{
			case 'HTMLEvents':
				e = new Event(event, settings);
				break;
			case 'MouseEvents':
				e = new MouseEvent(event, settings);
				break;
			default:
				e = new CustomEvent(event, params);
				break;
		}
		return e;
	},

	/**
	 * This will create a custom event. This supports html, mouse,
	 * and customevents.
	 *
	 * @param {string} event
	 * @param {object} obj
	 * @param {object} [options]
	 * @param {object} [params]
	 * @returns {object}
	 */
	createEvent(event, obj, options, params)
	{
		if (Types.isObject(obj) === false)
		{
			return false;
		}

		let settings =
		{
			pointerX: 0,
			pointerY: 0,
			button: 0,
			view: window,
			detail: 1,
			screenX: 0,
			screenY: 0,
			clientX: 0,
			clientY: 0,
			ctrlKey: false,
			altKey: false,
			shiftKey: false,
			metaKey: false,
			bubbles: true,
			cancelable: true,
			relatedTarget: null
		};

		if (Types.isObject(options))
		{
			settings = Object.assign(settings, options);
		}

		const eventType = this._getEventType(event);
		return this._createEvent(event, eventType, settings, params);
	},

	/**
	 * This will get thetype of an event.
	 *
	 * @protected
	 * @param {string} event
	 * @returns {string}
	 */
	_getEventType(event)
	{
		const eventTypes = {
			'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
			'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
		};

		let eventType = 'CustomEvent';
		for (const [prop, value] of Object.entries(eventTypes))
		{
			if (event.match(value))
			{
				eventType = prop;
				break;
			}
		}
		return eventType;
	},

	/**
	 * This will trigger an event.
	 *
	 * @param {string|object} event
	 * @param {object} obj
	 * @param {object} [params]
	 * @returns {object}
	 */
	trigger(event, obj, params)
	{
		if (Types.isObject(obj) === false)
		{
			return this;
		}

		const e = (typeof event === 'string')? this.createEvent(event, obj, null, params) : event;
		obj.dispatchEvent(e);
		return this;
	},

	/**
	 * @type {string|null} mouseWheelEventType The mouse wheel event name.
	 * @protected
	 */
	mouseWheelEventType: null,

	/**
	 * This will get the system mouse event.
	 *
	 * @protected
	 * @returns {string}
	 */
	getWheelEventType()
	{
		const getMouseWheelType = () =>
		{
			let type = 'wheel';
			if ('onmousewheel' in self)
			{
				type = 'mousewheel';
			}
			else if ('DOMMouseScroll' in self)
			{
				type = 'DOMMouseScroll';
			}
			return type;
		};

		/* this will get the event type or
		one time set the type and return the type */
		return this.mouseWheelEventType || (
			this.mouseWheelEventType = getMouseWheelType()
		);
	},

	/**
	 * This will add a mouse event to  an object.
	 *
	 * @param {function} callBackFn
	 * @param {object} [obj]
	 * @param {boolean} [cancelDefault]
	 * @param {boolean|object} [capture]
	 * @returns {object} base object.
	 */
	onMouseWheel(callBackFn, obj, cancelDefault, capture = false)
	{
		if (typeof obj === "undefined")
		{
			obj = window;
		}

		/* we want to return the mousewheel data
		to this private callback function before
		returning to the call back function*/
		const mouseWheelResults = (e) =>
		{
			const delta = Math.max(-1, Math.min(1, (-e.deltaY || e.wheelDelta || -e.detail)));

			/* we can now send the mouse wheel results to
			the call back function */
			if (typeof callBackFn === 'function')
			{
				callBackFn(delta, e);
			}

			/* we want to check to cancel default */
			if (cancelDefault === true)
			{
				e.preventDefault();
			}
		};

		const event = this.getWheelEventType();
		this.events.add(event, obj, mouseWheelResults, capture, true, callBackFn);
		return this;
	},

	/**
	 * This will remove a mouse event
	 *
	 * @param {function} callBackFn
	 * @param {object} [obj]
	 * @param {boolean|object} [capture]
	 * @returns {object} base object.
	 */
	offMouseWheel(callBackFn, obj, capture = false)
	{
		if (typeof obj === "undefined")
		{
			obj = window;
		}

		const event = this.getWheelEventType();
		this.off(event, obj, callBackFn, capture);
		return this;
	},

	/**
	 * This will prevent default on an event.
	 *
	 * @param {object} e
	 * @returns {object} base object.
	 */
	preventDefault(e)
	{
		if (typeof e.preventDefault === 'function')
		{
			e.preventDefault();
		}
		else
		{
			e.returnValue = false;
		}

		return this;
	},

	/**
	 * This will stop an event from propigating.
	 *
	 * @param {object} e
	 * @returns {object} base object.
	 */
	stopPropagation(e)
	{
		if (typeof e.stopPropagation === 'function')
		{
			e.stopPropagation();
		}
		else
		{
			e.cancelBubble = true;
		}

		return this;
	}
};