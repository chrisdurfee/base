import {base} from '../../core.js';

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

		/* this will check if the history api is supported 
		and enabled */
		this.enabled = false;
		this.locationId = 'base-app-router-' + routerNumber++; 
		this.callBack = null;
	}  
			
	/**
	 * This will check if the history api is supported
	 * and add events. 
	 * 
	 * @return {object} a reference to the object. 
	 */
	setup() 
	{ 
		/* we want to check if history is enabled */ 
		this.enabled = this.isSupported(); 

		/* we want to check to add the history event listener 
		that will check the popsate events and select the  
		nav option by the history state object */ 
		if(this.enabled !== true) 
		{ 
			return this; 
		}
				
		this.callBack = this.check.bind(this); 
		this.addEvent(); 
		return this; 
	}
	
	/**
	 * This will check if the browser supports the history api. 
	 * 
	 * @return {boolean}
	 */
	isSupported() 
	{ 
		return ('history' in window && 'pushState' in window.history);
	} 

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
		if(this.enabled !== true) 
		{
			return this; 
		}
			
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