import { Events } from "../../../main/events/events.js";
import { History } from "./history.js";

/**
 * BrowserHistory
 *
 * This will setup the history controller.
 *
 * @class
 */
export class BrowserHistory extends History
{
	/**
	 * This will add the events.
	 *
	 * @returns {object} a reference to the object.
	 */
	addEvent()
	{
		Events.on('popstate', window, this.callBack);
		return this;
	}

	/**
	 * This will remove the events.
	 *
	 * @returns {object} a reference to the object.
	 */
	removeEvent()
	{
		Events.off('popstate', window, this.callBack);
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
		const state = evt.state;
		if (!state || state.location !== this.locationId)
		{
			return false;
		}

		evt.preventDefault();
		evt.stopPropagation();

		this.router.checkActiveRoutes(state.uri);

		const scrollPosition = state.scrollPosition;
		if (scrollPosition)
		{
			this.scrollTo(scrollPosition);
		}
	}

	/**
	 * This will create a state object.
	 *
	 * @param {string} uri
	 * @param {*} data
	 * @returns {object}
	 */
	createState(uri, data = {})
	{
		const scrollPosition = this.getScrollPosition();

		return {
			location: this.locationId,
			...data,
			scrollPosition,
			uri
		};
	}

	/**
	 * This will add a state to the history.
	 *
	 * @param {string} uri
	 * @param {object} data
	 * @param {boolean} replace
	 * @returns {object} a reference to the object.
	 */
	addState(uri, data, replace = false)
	{
		const history = window.history,
		lastState = history.state;
		if (lastState && lastState.uri === uri)
		{
			return this;
		}

		const stateObj = this.createState(uri, data);
		const method = (replace === false)? 'pushState' : 'replaceState';
		history[method](stateObj, null, uri);

		return this;
	}
}