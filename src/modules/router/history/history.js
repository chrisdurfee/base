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
}