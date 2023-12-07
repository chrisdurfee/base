import { Arrays } from '../../shared/arrays.js';
import { Types } from '../../shared/types.js';
import { DataTracker } from '../data-tracker/data-tracker.js';

/**
 * Events
 *
 * This will add event adding, tracking, and
 * removing to an object.
 */
export const Events =
{
    /**
     * This will get the events on an element.
     *
     * @param {object} obj
     * @return {(array|boolean)}
     */
    getEvents(obj)
    {
        if (Types.isObject(obj) === false)
        {
            return false;
        }

        return DataTracker.get(obj, 'events');
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
     * @param {boolean} [capture]
     * @return {object} An instance of base.
     */
    on(event, obj, fn, capture)
    {
        if (Array.isArray(event))
        {
            let evt;
            for (var i = 0, length = event.length; i < length; i++)
            {
                evt = event[i];
                this.add(evt, obj, fn, capture);
            }
        }
        else
        {
            this.add(event, obj, fn, capture);
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
        if (Array.isArray(event))
        {
            var evt;
            for (var i = 0, length = event.length; i < length; i++)
            {
                evt = event[i];
                this.remove(evt, obj, fn, capture);
            }
        }
        else
        {
            this.remove(event, obj, fn, capture);
        }
        return this;
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
        if (Types.isObject(obj) === false)
        {
            return this;
        }

        /* we want to create an event object and add it the
        the active events to track */
        const data = this.create(event, obj, fn, capture, swapped, originalFn);
        DataTracker.add(obj, 'events', data);

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
        const result = this.getEvent(event, obj, fn, capture);
        if (result === false)
        {
            return this;
        }

        if (typeof result === 'object')
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
        if (typeof listener === 'object')
        {
            const obj = listener.obj;
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
        if (typeof obj !== 'object')
        {
            return false;
        }

        const events = this.getEvents(obj);
        if (!events || events.length < 1)
        {
            return false;
        }

        const eventObj = this.create(event, obj, fn, capture);
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
        for (var i = 0, maxLength = events.length; i < maxLength; i++)
        {
            listener = events[i];
            if (listener.event !== eventObj.event || listener.obj !== eventObj.obj)
            {
                continue;
            }

            if (listener.fn === eventObj.fn || (swappable === true && listener.originalFn === eventObj.fn))
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
        if (Types.isObject(obj) === false)
        {
            return this;
        }

        DataTracker.remove(obj, 'events');

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
        /**
         * We want to check if the event type is in the
         * swapped event array.
         */
        const index = Arrays.inArray(this.swap, event);
        return (index > -1);
    }
};

/**
 * This will register the event system to the data tracker
 * to remove events that have been added in layouts.
 */
DataTracker.addType('events', (data) =>
{
    Events.removeEvent(data);
});