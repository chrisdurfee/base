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
		 * @member {object} data
		 */
		this.data = data;

		/**
		 * @member {string} prop
		 */
		this.prop = prop;
	}

	/**
	 * This will set the data value.
	 *
	 * @param {mixed} value
	 * @return {void}
	 */
	set(value)
	{
		this.data.set(this.prop, value);
	}

	/**
	 * This will get the data value.
	 *
	 * @return {mixed}
	 */
	get()
	{
		return this.data.get(this.prop);
	}

	/**
	 * The callBack when updated.
	 *
	 * @param {mixed} value
	 * @param {object} committer
	 * @return {void}
	 */
	callBack(value, committer)
	{
		if (this.data !== committer)
		{
			this.data.set(this.prop, value, committer);
		}
	}
}