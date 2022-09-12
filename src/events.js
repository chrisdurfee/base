
import {base} from './main.js';
export {base} from './main.js';

const dataTracker = base.dataTracker;

export const events =
{
    /**
     * This will get the events on an element.
     *
     * @param {object} obj
     * @return {(array|boolean)}
     */
    getEvents(obj)
    {
        if(base.isObject(obj) === false)
        {
            return false;
        }
        return dataTracker.get(obj, 'events');
    },

    /**
     * This will create an object to use with the dataTracker.
     *
     * @param {string} event The event name.
     * @param {object} obj
     * @param {function} fn
     * @param {boolean} [capture]
     * @param {boolean} [swapped]
     * @param {function} [originalFn]
     * @return {object}
     */
    create(event, obj, fn, capture = false, swapped = false, originalFn = null)
    {
        /* we want to check if the swapped param was set */
        swapped = (swapped === true);

        return {
            event,
            obj,
            fn,
            capture,
            swapped,
            originalFn
        };
    },

    /**
     * This will add an event to an object.
     *
     * @param {string} event The event name.
     * @param {object} obj
     * @param {function} fn
     * @param {(object|boolean)} [capture]
     * @param {boolean} [swapped]
     * @param {function} [originalFn]
     */
    add(event, obj, fn, capture = false, swapped = false, originalFn = null)
    {
        if(base.isObject(obj) === false)
        {
            return this;
        }

        /* we want to create an event object and add it the
        the active events to track */
        let data = this.create(event, obj, fn, capture, swapped, originalFn);
        dataTracker.add(obj, 'events', data);

        obj.addEventListener(event, fn, capture);

        return this;
    },

    /**
     * This will remove an event from an object.
     *
     * @param {string} event The event name.
     * @param {object} obj
     * @param {function} fn
     * @param {(object|boolean)} [capture]
     * @return {object} a reference to the event object.
     */
    remove(event, obj, fn, capture = false)
    {
        let result = this.getEvent(event, obj, fn, capture);
        if(result === false)
        {
            return this;
        }

        if(typeof result === 'object')
        {
            /* we want to use the remove event method and just
            pass the listener object */
            this.removeEvent(result);
        }
        return this;
    },

    /**
     * This will remove an event listener.
     * @param {object} listener
     * @return {object} a reference to the event object.
     */
    removeEvent(listener)
    {
        if(typeof listener === 'object')
        {
            let obj = listener.obj;
            obj.removeEventListener(listener.event, listener.fn, listener.capture);
        }
        return this;
    },

    /**
     * This will search for an event.
     *
     * @protected
     * @param {string} event The event name.
     * @param {object} obj
     * @param {function} fn
     * @param {boolean} [capture]
     * @return {(object|boolean)}
     */
    getEvent(event, obj, fn, capture)
    {
        if(typeof obj !== 'object')
        {
            return false;
        }

        let events = this.getEvents(obj);
        if(!events || events.length < 1)
        {
            return false;
        }

        let eventObj = this.create(event, obj, fn, capture);
        /* if the search returns anything but false we
        found our active event */
        return this.search(eventObj, events);
    },

    /**
     * This will search for an event from the object events.
     *
     * @param {object} eventObj
     * @param {array} events
     * @return {(object|boolean)}
     */
    search(eventObj, events)
    {
        let listener,
        swappable = this.isSwappable(eventObj.event);
        for(var i = 0, maxLength = events.length; i < maxLength; i++)
        {
            listener = events[i];
            if(listener.event !== eventObj.event || listener.obj !== eventObj.obj)
            {
                continue;
            }

            if(listener.fn === eventObj.fn || (swappable === true && listener.originalFn === eventObj.fn))
            {
                return listener;
            }
        }

        return false;
    },

    /**
     * This will remove all events on an object.
     *
     * @param {object} obj
     * @return {object} a reference to the events object.
     */
    removeEvents(obj)
    {
        if(base.isObject(obj) === false)
        {
            return this;
        }

        dataTracker.remove(obj, 'events');

        return this;
    },

    /**
     * @member {array} swap The swappable events.
     */
    swap: [
        'DOMMouseScroll',
        'wheel',
        'mousewheel',
        'mousemove',
        'popstate'
    ],

    /**
     * This will a event type to the swappable array.
     *
     * @param {string} type
     */
    addSwapped(type)
    {
        this.swap.push(type);
    },

    /**
     * This will check if an event is swappable.
     *
     * @param {string} event
     * @return {boolean}
     */
    isSwappable(event)
    {
        /* we want to check if the event type is in the
        swapped event array */
        let index = base.inArray(this.swap, event);
        return (index > -1);
    }
};

/* this will register the event system to the
data tracker to remove events that have been
added in layouts. */
dataTracker.addType('events', (data) =>
{
    events.removeEvent(data);
});

base.augment(
{
    /**
     * @param object events
     */
    events,

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
        let events = this.events;
        if(this.isArray(event))
        {
            let evt;
            for(var i = 0, length = event.length; i < length; i++)
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
        let events = this.events;
        if(this.isArray(event))
        {
            var evt;
            for(var i = 0, length = event.length; i < length; i++)
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
        if(eventType === 'HTMLEvents')
        {
            e = new Event(event);
        }
        else if(eventType === 'MouseEvents')
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
        if(this.isObject(obj) === false)
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

        if(base.isObject(options))
        {
            settings = Object.assign(settings, options);
        }

        let eventType = this._getEventType(event);
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
        let eventTypes = {
            'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
            'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
        },

        value,
        eventType = 'CustomEvent';
        for(var prop in eventTypes)
        {
            if(eventTypes.hasOwnProperty(prop))
            {
                value = eventTypes[prop];
                if(event.match(value))
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
        if(this.isObject(obj) === false)
        {
            return this;
        }

        let e = (typeof event === 'string')? this.createEvent(event, obj, null, params) : event;
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
        let getMouseWheelType = () =>
        {
            let type = 'wheel';
            if('onmousewheel' in self)
            {
                type = 'mousewheel';
            }
            else if('DOMMouseScroll' in self)
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
        if(typeof obj === "undefined")
        {
                obj = window;
        }

        /* we want to return the mousewheel data
        to this private callback function before
        returning to the call back function*/
        let mouseWheelResults = (e) =>
        {
            e = e || window.event;
            let delta = Math.max(-1, Math.min(1, (-e.deltaY || e.wheelDelta || -e.detail)));

            /* we can now send the mouse wheel results to
            the call back function */
            if(typeof callBackFn === 'function')
            {
                callBackFn(delta, e);
            }

            /* we want to check to cancel default */
            if(cancelDefault === true)
            {
                e.preventDefault();
            }
        };

        let event = this.getWheelEventType();
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
        if(typeof obj === "undefined")
        {
            obj = window;
        }

        let event = this.getWheelEventType();
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
        e = e || window.event;

        if(typeof e.preventDefault === 'function')
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
        e = e || window.event;

        if(typeof e.stopPropagation === 'function')
        {
            e.stopPropagation();
        }
        else
        {
            e.cancelBubble = true;
        }

        return this;
    }
});