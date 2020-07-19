import {base} from '../../core.js';
export {DataPubSub} from './data-pub-sub.js';
import {pubSub} from './data-pub-sub.js';
import {OneWayConnection} from './one-way-connection.js';
import {TwoWayConnection} from './two-way-connection.js';
import {ConnectionTracker} from './connection-tracker.js';

/**
 * DataBinder
 * 
 * This will create a data binder object that can 
 * create one way and two way data bindings. 
 * @class
 */
export class DataBinder
{ 
	/**
	 * @constructor
	 */
	constructor() 
	{ 
		this.version = "1.0.1";
		this.attr = 'data-bind-id'; 

		this.connections = new ConnectionTracker(); 

		this.idCount = 0; 
		this.setup(); 
	} 

	/**
	 * This will setup the events. 
	 * @protected
	 */
	setup() 
	{ 
		this.setupEvents();
	} 

	/**
	 * This will bind an element to a data property. 
	 * 
	 * @param {object} element 
	 * @param {object} data 
	 * @param {string} prop 
	 * @param {(string|function)} [filter] 
	 * @return {object} an instance of the databinder. 
	 */
	bind(element, data, prop, filter) 
	{ 
		let bindSettings = this.getPropSettings(prop); 
		prop = bindSettings.prop; 
		
		/* this will setup the model bind attr to the 
		element and assign a bind id attr to support 
		two way binding */ 
		let connection = this.setupConnection(element, data, prop, bindSettings.attr, filter);   

		/* we want to get the starting value of the 
		data and set it on our element */ 
		let connectionElement = connection.element, 
		value = data.get(prop); 
		if(typeof value !== 'undefined') 
		{ 
			connectionElement.set(value); 
		}
		else 
		{ 
			/* this will set the element value 
			as the prop value */ 
			value = connectionElement.get(); 
			if(value !== '')
			{ 
				connection.data.set(value);
			} 
		}
		return this; 
	} 
	
	/**
	 * This will bind an element to a data property. 
	 * 
	 * @protected
	 * @param {object} element 
	 * @param {object} data 
	 * @param {string} prop 
	 * @param {string} customAttr
	 * @param {(string|function)} [filter] 
	 * @return {object} The new connection. 
	 */
	setupConnection(element, data, prop, customAttr, filter)
	{
		let id = this.getBindId(element),
		connection = new TwoWayConnection(),

		// this will create the data source 
		dataSource = connection.addData(data, prop); 
		// this will subscribe the data to the element
		dataSource.subscribe(id); 
		
		/* this will add the data binding 
		attr to our element so it will subscribe to 
		the two data changes */
		let dataId = data.getDataId(), 
		msg = dataId + ':' + prop; 
		
		// this will create the element source 
		let elementSource = connection.addElement(element, customAttr, filter); 
		// this will subscribe the element to the data
		elementSource.subscribe(msg); 
		
		this.addConnection(id, 'bind', connection);
		
		return connection;  
	} 
	
	/**
	 * This will add a new connection to the 
	 * connection tracker. 
	 * 
	 * @protected 
	 * @param {string} id 
	 * @param {string} attr 
	 * @param {object} connection 
	 */
	addConnection(id, attr, connection)
	{
		this.connections.add(id, attr, connection);
	} 
	
	/**
	 * This will set the bind id. 
	 * 
	 * @param {object} element 
	 */
	setBindId(element)
	{
		let id = 'bs-db-' + this.idCount++; 
		base.attr(element, this.attr, id);
		return id; 
	} 
	
	/**
	 * This will get the bind id. 
	 * 
	 * @param {object} element 
	 * @return {string}
	 */
	getBindId(element)
	{
		let id = base.attr(element, this.attr); 
		if(!id) 
		{
			id = this.setBindId(element); 
		}
		return id; 
	} 
	
	/**
	 * This will parse the prop to get the settings. 
	 * 
	 * @param {string} prop 
	 * @return {object}
	 */
	getPropSettings(prop)
	{
		let attr = null; 
		
		/* this will setup the custom attr if the prop 
		has specified one. */ 
		let parts = prop.split(':'); 
		if(parts.length > 1)
		{
			[attr, prop] = parts; 
		}
		
		return {
			prop, 
			attr
		}; 
	} 
	
	/**
	 * This will unbind the element. 
	 * 
	 * @param {object} element 
	 * @return {object} an instance of the data binder. 
	 */
	unbind(element) 
	{ 
		let id = base.data(element, this.attr); 
		if(id)
		{
			this.connections.remove(id);
		} 
		return this;
	} 
	
	/**
	 * This will setup a watcher for an element. 
	 * 
	 * @param {object} element 
	 * @param {object} data 
	 * @param {string} prop 
	 * @param {function} callBack 
	 */
	watch(element, data, prop, callBack)
	{
		if(!element || typeof element !== 'object')
		{
			return false; 
		}
		
		let connection = new OneWayConnection();
		
		// this will create the one way source 
		const source = connection.addSource(data); 
		source.subscribe(prop, callBack);
		
		// this will add the new connection to the connection tracker
		const id = this.getBindId(element),
		attr = data.getDataId() + ':' + prop; 
		this.addConnection(id, attr, connection);  
		
		let value = data.get(prop); 
		if(typeof value !== 'undefined')
		{
			callBack(value); 
		}
	} 
	
	/**
	 * This will remove a watcher from an element. 
	 * 
	 * @param {object} element 
	 * @param {object} data 
	 * @param {string} prop 
	 */
	unwatch(element, data, prop)
	{
		if(!element || typeof element !== 'object')
		{
			return false; 
		} 
		
		let id = base.attr(element, this.attr); 
		if(id)
		{
			let attr = data.getDataId() + ':' + prop;
			this.connections.remove(id, attr);
		} 
	} 

	/**
	 * This will publish to the pub sub. 
	 * 
	 * @param {string} msg 
	 * @param {*} value 
	 * @param {object} committer 
	 * @return {object} an instance of the data binder. 
	 */
	publish(msg, value, committer)
	{ 
		pubSub.publish(msg, value, committer);
		return this;
	} 
	
	/**
	 * This will check if an element is bound. 
	 * 
	 * @protected
	 * @param {object} element 
	 * @return {boolean}
	 */
	isDataBound(element) 
	{ 
		if(element)
		{ 
			let id = base.data(element, this.attr); 
			if(id)
			{
				return id; 
			}
		}
		return false; 
	} 
	
	/**
	 * @member {array} blockedKeys
	 * @protected
	 */
	blockedKeys = [
		20, //caps lock 
		37, //arrows 
		38, 
		39, 
		40 
	]; 

	isBlocked(evt)
	{
		if(evt.type !== 'keyup')
		{ 
			return false; 
		}

		/* this will check to block ctrl, shift or alt + 
		buttons */ 
		return (this.blockedKeys.indexOf(evt.keyCode) !== -1);
	}
	
	/**
	 * This is the callBack for the chnage event. 
	 * 
	 * @param {object} evt 
	 */
	bindHandler(evt) 
	{
		if(this.isBlocked(evt))
		{
			return true; 
		}

		let target = evt.target || evt.srcElement,
		id = this.isDataBound(target); 
		if(id)
		{ 
			let connection = this.connections.get(id, 'bind'); 
			if(connection)
			{
				let value = connection.element.get(); 
				/* this will publish to the ui and to the
				model that subscribes to the element */ 
				pubSub.publish(id, value, target);
			} 
		}
		evt.stopPropagation();
	} 

	/* this will setup the on change handler and 
	add the events. this needs to be setup before adding 
	the events. */ 
	changeHandler = null; 

	/**
	 * This wil setup the events. 
	 * @protected
	 */
	setupEvents() 
	{  
		this.changeHandler = this.bindHandler.bind(this); 

		this.addEvents();  
	} 

	/**
	 * This will add the events. 
	 */ 
	addEvents() 
	{ 
		base.on(["change", "keyup"], document, this.changeHandler, false); 
	} 

	/**
	 * This will remove the events. 
	 */
	removeEvents() 
	{ 
		base.off(["change", "keyup"], document, this.changeHandler, false);
	}
} 

export const dataBinder = new DataBinder();