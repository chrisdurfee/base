import {DataSource} from './data-source.js';
import {ElementSource} from './element-source.js';
import {Connection} from './connection.js';

/**
 * TwoWayConnection
 * 
 * This will setup a two way connection. 
 * @class
 * @augments Connection
 */
export class TwoWayConnection extends Connection
{
	/**
	 * @constructor
	 */
	constructor()
	{
		super();
		
		this.element = null; 
		this.data = null; 
	} 
	
	/**
	 * This will add the element source. 
	 * 
	 * @param {object} element 
	 * @param {string} attr 
	 * @param {(string|function)} filter 
	 * @return {object}
	 */
	addElement(element, attr, filter)
	{
		return (this.element = new ElementSource(element, attr, filter)); 
	} 
	
	/**
	 * This will add the data source. 
	 * 
	 * @param {object} data 
	 * @param {string} prop 
	 * @return {object}
	 */
	addData(data, prop)
	{
		return (this.data = new DataSource(data, prop));  
	} 
	
	/**
	 * This will unsubscribe from a source. 
	 * 
	 * @param {object} source 
	 */
	unsubscribeSource(source)
	{
		if(source)
		{
			source.unsubscribe(); 
		}
	} 
	
	/**
	 * This will be used to unsubscribe. 
	 * @override
	 */
	unsubscribe()
	{
		this.unsubscribeSource(this.element); 
		this.unsubscribeSource(this.data); 
		
		this.element = null; 
		this.data = null;
	}
}