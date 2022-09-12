import {base} from '../../core.js';

/**
 * History
 *
 * This will setup the history controller.
 * @class
 */
export class HistoryController
{
    /**
     * This will check if browser based navigation is supported
     *
     * @returns boolean
     */
    static browserIsSupported()
    {
        return ('history' in window && 'pushState' in window.history);
    }

    /**
     * This will create a History Object based on navigation support
     *
     * @param {Router} router
     * @returns History
     */
    static setup(router)
    {
        if(HistoryController.browserIsSupported())
        {
            return new BrowserHistory(router).setup();
        }
        return new HashHistory(router).setup();
    }
}

let routerNumber = 0;

/**
 * History
 *
 * This will setup the history controller.
 * @class
 */
class History
{
	/**
	 * @constructor
	 * @param {object} router
	 */
	constructor(router)
	{
		this.router = router;
		this.locationId = 'base-app-router-' + routerNumber++;
		this.callBack = this.check.bind(this);
	}

	/**
	 * This will check if the history api is supported
	 * and add events.
	 *
	 * @return {object} a reference to the object.
	 */
	setup()
	{
		this.addEvent();
		return this;
	}
}

class BrowserHistory extends History
{
	/**
	 * This will add the events.
	 *
	 * @return {object} a reference to the object.
	 */
	addEvent()
	{
		base.on('popstate', window, this.callBack);
		return this;
	}

	/**
	 * This will remove the events.
	 *
	 * @return {object} a reference to the object.
	 */
	removeEvent()
	{
		base.off('popstate', window, this.callBack);
		return this;
	}

	/**
	 * This will check to activate the router.
	 *
	 * @param {object} evt
	 */
	check(evt)
	{
		/* we want to check if the event has a state and if the
		state location is from the background */
		let state = evt.state;
		if(!state || state.location !== this.locationId)
		{
			return false;
		}

		evt.preventDefault();
		evt.stopPropagation();

		this.router.checkActiveRoutes(state.uri);
	}

	/**
	 * This will create a state object.
	 *
	 * @param {string} uri
	 * @param {*} data
	 * @return {object}
	 */
	createState(uri, data)
	{
		let stateObj = {
			location: this.locationId,
			uri: uri
		};

		if(data && typeof data === 'object')
		{
			stateObj = Object.assign(stateObj, data);
		}

		return stateObj;
	}

	/**
	 * This will add a state to the history.
	 *
	 * @param {string} uri
	 * @param {object} data
	 * @param {boolean} replace
	 * @return {object} a reference to the object.
	 */
	addState(uri, data, replace)
	{
		let history = window.history,
		lastState = history.state;

		if(lastState && lastState.uri === uri)
		{
			return this;
		}

		let stateObj = this.createState(uri, data);

		/* this will check to push state or
		replace state */
		replace = (replace === true);
		let method = (replace === false)? 'pushState' : 'replaceState';
		history[method](stateObj, null, uri);

		return this;
	}
}

class HashHistory extends History
{
	/**
	 * This will add the events.
	 *
	 * @return {object} a reference to the object.
	 */
	addEvent()
	{
		base.on('hashchange', window, this.callBack);
		return this;
	}

	/**
	 * This will remove the events.
	 *
	 * @return {object} a reference to the object.
	 */
	removeEvent()
	{
		base.off('hashchange', window, this.callBack);
		return this;
	}

	/**
	 * This will check to activate the router.
	 *
	 * @param {object} evt
	 */
	check(evt)
	{
		this.router.checkActiveRoutes(evt.newURL);
	}

	/**
	 * This will add a state to the history.
	 *
	 * @param {string} uri
	 * @param {object} data
	 * @param {boolean} replace
	 * @return {object} a reference to the object.
	 */
	addState(uri, data, replace)
	{
		window.location.hash = uri;

		return this;
	}
}