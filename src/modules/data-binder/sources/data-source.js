import { TwoWaySource } from './two-way-source.js';

/**
 * DataSource
 *
 * This will create a data source to use with
 * a connection.
 *
 * @class
 * @augments TwoWaySource
 */
export class DataSource extends TwoWaySource
{
	/**
	 * This will create a new data source.
	 *
	 * @constructor
	 * @param {object} data
	 * @param {string} prop
	 * @param {object} pubSub
	 */
	constructor(data, prop, pubSub)
	{
		super(pubSub);

		/**
		 * @type {object} data
		 */
		this.data = data;

		/**
		 * @type {?string} prop
		 */
		this.prop = prop;
	}

	/**
	 * This will set the data value.
	 *
	 * @param {*} value
	 * @returns {void}
	 */
	set(value)
	{
		this.data.set(this.prop, value);
	}

	/**
	 * This will get the data value.
	 *
	 * @returns {*}
	 */
	get()
	{
		return this.data.get(this.prop);
	}

	/**
	 * The callBack when updated.
	 *
	 * @overload
	 * @param {*} value
	 * @param {object} committer
	 * @returns {void}
	 */
	// @ts-ignore
	callBack(value, committer)
	{
		if (this.data !== committer)
		{
			this.data.set(this.prop, value, committer);
		}
	}

	/**
	 * This will clean up the data source.
	 *
	 * @override
	 * @returns {void}
	 */
	unsubscribe()
	{
		super.unsubscribe();
		this.data = null;
		this.prop = null;
	}
}