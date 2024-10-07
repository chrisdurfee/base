
let routerNumber = 0;

/**
 * History
 *
 * This will setup the history controller.
 * @class
 */
export class History
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
	 * @returns {object} a reference to the object.
	 */
	setup()
	{
		this.addEvent();
		return this;
	}

	/**
	 * This will check to activate the router.
	 *
	 * @param {object} evt
	 */
	check(evt)
	{

	}

	/**
	 * This will get the current scroll position.
	 *
	 * @returns {object}
	 */
	getScrollPosition()
	{
		return {
			x: window.scrollX,
			y: window.scrollY
		};
	}

	/**
	 * This will scroll to a position.
	 *
	 * @param {object} scrollPosition
	 * @returns {void}
	 */
	scrollTo(scrollPosition)
	{
		window.scrollTo(scrollPosition.x, scrollPosition.y);
	}

	/**
	 * This will add the events.
	 *
	 * @returns {object} a reference to the object.
	 */
	addEvent()
	{
		return this;
	}
}