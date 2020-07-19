import {TwoWaySource} from './two-way-source.js';

/**
 * DataSource 
 * 
 * This will create a data source to use with 
 * a connection. 
 * @class
 * @augments TwoWaySource
 */
export class DataSource extends TwoWaySource
{
	/**
	 * @constructor
	 * @param {object} data 
	 * @param {string} prop 
	 */
	constructor(data, prop)
	{
		super(); 
		this.data = data;  
		this.prop = prop;   
	} 
	
	/**
	 * This will set the data value. 
	 * 
	 * @param {*} value 
	 */
	set(value)
	{
		this.data.set(this.prop, value); 
	} 
	
	/**
	 * This will get the data value. 
	 */
	get()
	{
		return this.data.get(this.prop);
	} 
	
	/**
	 * The callBack when updated. 
	 * 
	 * @param {*} value 
	 * @param {object} committer 
	 */
	callBack(value, committer) 
	{
		if(this.data !== committer) 
		{
			this.data.set(this.prop, value, committer); 
		}
	}
}