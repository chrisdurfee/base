import { Events } from "../../../main/events/events.js";
import { History } from "./history.js";

/**
 * HashHistory
 *
 * This will setup the history controller.
 *
 * @class
 */
export class HashHistory extends History
{
	/**
	 * This will add the events.
	 *
	 * @return {object} a reference to the object.
	 */
	addEvent()
	{
		Events.on('hashchange', window, this.callBack);
		return this;
	}

	/**
	 * This will remove the events.
	 *
	 * @return {object} a reference to the object.
	 */
	removeEvent()
	{
		Events.off('hashchange', window, this.callBack);
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