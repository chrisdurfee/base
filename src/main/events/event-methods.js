import { Events } from './events.js';

/**
 * This will create an object that can be added to base to
 * add event methods.
 */
export const EventMethods =
{
    /**
     * @param object events
     */
    events: Events,

    /**
     * This will add an event to an object.
     *
     * @param {string} event The event name.
     * @param {object} obj
     * @param {function} fn
     * @param {boolean} [capture]
     * @return {object} An instance of base.
     */
    addListener(event, obj, fn, capture)
    {
        this.events.add(event, obj, fn, capture);

        return this;
    },

    /**
     * This will add an event to an object.
     *
     * @param {string} event The event name.
     * @param {object} obj
     * @param {function} fn
     * @param {boolean} [capture]
     * @return {object} An instance of base.
     */
    on(event, obj, fn, capture)
    {
        const events = this.events;
        if (Array.isArray(event))
        {
            let evt;
            for (var i = 0, length = event.length; i < length; i++)
            {
                evt = event[i];
                events.add(evt, obj, fn, capture);
            }
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
     * @param {string} event The event name.
     * @param {object} obj
     * @param {function} fn
     * @param {boolean} [capture]
     * @return {object} An instance of base.
     */
    off(event, obj, fn, capture)
    {
        const events = this.events;
        if (Array.isArray(event))
        {
            var evt;
            for (var i = 0, length = event.length; i < length; i++)
            {
                evt = event[i];
                events.remove(evt, obj, fn, capture);
            }
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
     * @param {boolean} [capture]
     * @return {object} An instance of base.
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
     * @return {object}
     */
    _createEvent(event, eventType, settings, params)
    {
        let e;
        if (eventType === 'HTMLEvents')
        {
            e = new Event(event);
        }
        else if (eventType === 'MouseEvents')
        {
            e = new MouseEvent(event, settings);
        }
        else
        {
            e = new CustomEvent(event, params);
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
     * @return {object}
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
     * @return {string}
     */
    _getEventType(event)
    {
        const eventTypes = {
            'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
            'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
        };

        let value,
        eventType = 'CustomEvent';
        for (var prop in eventTypes)
        {
            if (eventTypes.hasOwnProperty(prop))
            {
                value = eventTypes[prop];
                if (event.match(value))
                {
                    eventType = prop;
                    break;
                }
            }
        }
        return eventType;
    },

    /**
     * This will trigger an event.
     *
     * @param {(string|object)} event
     * @param {object} obj
     * @param {object} [params]
     * @return {object}
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
     * @member {string} mouseWheelEventType The mouse wheel event name.
     * @protected
     */
    mouseWheelEventType: null,

    /**
     * This will get the system mouse event.
     *
     * @protected
     * @return {string}
     */
    getWheelEventType()
    {
        /* this will check what mouse wheel type
        the client supports
        @return (string) the event name */
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
     * @param {boolean} capture
     * @return {object} base object.
     */
    onMouseWheel(callBackFn, obj, cancelDefault, capture)
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
     * @param {boolean} capture
     * @return {object} base object.
     */
    offMouseWheel(callBackFn, obj, capture)
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
     * @return {object} base object.
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
     * @return {object} base object.
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