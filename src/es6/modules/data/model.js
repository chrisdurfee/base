import {Data} from './deep-data.js';
import {ModelService} from './model-service.js';
import {setupAttrSettings} from './attrs.js';

/**
 * This will get the defaults from the settings. 
 * 
 * @param {object} settings 
 * @return {object}
 */
const setupDefaultAttr = (settings) =>
{ 
	let attributes = {};
	if(!settings || typeof settings !== 'object')
	{ 
		return attributes; 
	}
		
	let defaults = settings.defaults;
	if(!defaults)
	{ 
		return attributes; 
	}
		
	for(var prop in defaults) 
	{ 
		if(defaults.hasOwnProperty(prop)) 
		{ 
			var attr = defaults[prop]; 
			if(typeof attr !== 'function')
			{ 
				attributes[prop] = attr;
			}
		}
	}
	delete settings.defaults;
	return attributes; 
}; 

/**
 * This will get the xhr settings. 
 * 
 * @param {object} settings 
 * @return {object}
 */
const getXhr = (settings) =>
{ 
	if(!settings || typeof settings.xhr !== 'object')
	{ 
		return {}; 
	}
	
	let settingsXhr = settings.xhr, 
	xhr = Object.assign({}, settingsXhr);
	delete settings.xhr; 
	return xhr;
};

/* this will track the number of model types */ 
let modelTypeNumber = 0;

/**
 * Model
 * 
 * This will extend Data to add a model that can specify 
 * a service that connects to a remote source. 
 */
export class Model extends Data
{ 
	/**
	 * @constructor
	 * @param {object} [settings] 
	 */
	constructor(settings)
	{  
		super(settings);    
		this.initialize();  
	}

	/**
	 * This adds a method to call if you want the model 
	 * to do something when its initialized. 
	 */
	initialize() 
	{ 

	}

	/**
	 * This will extend the model to a child model.
	 * 
	 * @param {object} [settings] 
	 * @return {class}
	 */
	static extend(settings = {})
	{   
		const parent = this, 
		xhr = getXhr(settings),
		service = this.prototype.service.extend(xhr);
	
		/* this will setup the default attribute settings for 
		the model */ 
		let defaultAttributes = setupDefaultAttr(settings); 
		class model extends parent
		{
			constructor(instanceSettings)
			{ 
				/* this will get the instance attributes that 
				the model will set as attribute data */ 
				let instanceAttr = setupAttrSettings(instanceSettings);
		
				/* we want to extend the default attr with the 
				instance attr before we set the data and call 
				the parent constructor */ 
				instanceAttr = Object.assign({}, defaultAttributes, instanceAttr); 
				super(instanceAttr);
				
				/* this will setup the model service and 
				pass the new model instance to the service */ 
				this.xhr = new service(this);
			}
	
			dataTypeId = 'bm' + (modelTypeNumber++);
		}

		Object.assign(model.prototype, settings);
		model.prototype.service = service;
		
		return model;  
	}
}

Model.prototype.service = ModelService;