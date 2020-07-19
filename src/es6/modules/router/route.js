import {ComponentHelper} from './component-helper.js';
import {SimpleData} from '../data/data.js'; 

/**
 * This will setup a route uri pattern. 
 * 
 * @param {string} uri 
 * @return {string}
 */
const routePattern = (uri) =>
{ 
	let uriQuery = ""; 
	if(uri) 
	{ 
		/* we want to setup the wild card and param 
		checks to be modified to the route uri string */ 
		let allowAll = /(\*)/g, 
		param = /(:[^\/?&($]+)/g, 
		optionalParams = /(\?\/+\*?)/g, 
		optionalSlash = /(\/):[^\/(]*?\?/g, 
		filter = /\//g; 
		uriQuery = uri.replace(filter, "\/").replace(allowAll, '.*'); 

		/* this will setup for optional slashes before the optional params */ 
		uriQuery = uriQuery.replace(optionalSlash, (str) =>
		{  
			let pattern = /\//g; 
			return str.replace(pattern, '(?:$|\/)');  
		}); 

		/* this will setup for optional params and params 
		and stop at the last slash or query start */ 
		uriQuery = uriQuery.replace(optionalParams, '?\/*').replace(param, '([^\/|?]+)'); 
	} 

	/* we want to set and string end if the wild card is not set */ 
	uriQuery += (uri[uri.length - 1] === '*')? '' : '$'; 
	return uriQuery;
}; 

/**
 * This will get the default route params. 
 * 
 * @param {array} params
 * @return {(object|null)}
 */
const getParamDefaults = (params) =>
{
	if(params.length)
	{
		let defaults = {}; 
		for(var i = 0, length = params.length; i < length; i++)
		{
			defaults[params[i]] = null; 
		}
		return defaults; 
	}
	return null; 
};

/**
 * This will get the param keys from the uri. 
 * 
 * @param {string} uri 
 * @return {array}
 */
const paramPattern = (uri) =>
{ 
	let params = []; 
	if(!uri) 
	{ 
		return params; 
	}

	let filter = /[\*?]/g;
	uri = uri.replace(filter, '');
			
	let pattern = /:(.[^\/?&($]+)\?*/g, 
	matches = uri.match(pattern); 
	if(matches === null) 
	{ 
		return params; 
	}
			
	for(var i = 0, maxLength = matches.length; i < maxLength; i++) 
	{ 
		var param = matches[i]; 
		if(param) 
		{ 
			param = param.replace(':', ''); 
			params.push(param); 
		} 
	}
	return params;
}; 

let routeCount = 0; 

/**
 * Route
 * 
 * This will create a route. 
 * @class
 * @augments SimpleData
 */
export class Route extends SimpleData 
{ 
	/**
	 * @constructor
	 * @param {object} settings 
	 */
	constructor(settings)
	{
		let uri = settings.baseUri; 

		const paramKeys = paramPattern(uri);
		let params = getParamDefaults(paramKeys); 
		super(params); 

		this.uri = uri;
		this.paramKeys = paramKeys;
		
		this.setupRoute(settings);    
		this.set('active', false); 
	} 
	
	/**
	 * This will setup the route settings. 
	 * 
	 * @protected
	 * @param {object} settings 
	 */
	setupRoute(settings)
	{
		this.id = settings.id || 'bs-rte-' + routeCount++;
		
		this.path = null; 
		this.referralPath = null;

		/* route reg ex */ 
		let uriMatch = routePattern(this.uri); 
		this.uriQuery = new RegExp('^' + uriMatch); 

		/* params */ 
		this.params = null;

		/* this will setup the template and route component 
		if one has been set */   
		this.setupComponentHelper(settings); 

		this.callBack = settings.callBack;
		this.title = settings.title;
	} 
	
	/**
	 * This will deactivate the route. 
	 */
	deactivate()
	{ 
		this.set('active', false);
		
		let controller = this.controller; 
		if(controller)
		{ 
			controller.remove(); 
		}
	}
	
	/**
	 * This will setup the route component. 
	 * 
	 * @protected
	 * @param {object} settings 
	 */
	setupComponentHelper(settings)
	{ 
		if(settings.component)
		{
			let {component, container, persist = false, parent} = settings;

			const helperSettings = 
			{
				component, 
				container, 
				persist,
				parent
			}; 
			this.controller = new ComponentHelper(this, helperSettings); 
		}
	} 
	
	/**
	 * This will set the route path. 
	 * 
	 * @param {string} path 
	 * @param {string} referralPath
	 */
	setPath(path, referralPath)
	{
		this.path = path; 
		this.referralPath = referralPath;
	} 
	
	/**
	 * This will select the route. 
	 */
	select()
	{ 
		this.set('active', true);
		
		let params = this.stage,
		callBack = this.callBack; 
		if(typeof callBack === 'function') 
		{ 
			callBack(params); 
		} 

		let controller = this.controller; 
		if(controller)
		{ 
			controller.focus(params); 
		}
	} 
	
	/**
	 * This will check if a route matches the path. 
	 * 
	 * @param {string} path 
	 * @return {(object|boolean)}
	 */
	match(path)
	{
		let matched = false;
		
		/* we want to check to use the supplied uri or get the 
		current uri if not setup */ 
		let result = path.match(this.uriQuery); 
		if(result === null)
		{
			this.resetParams();
			return matched; 
		}
		
		if(result && typeof result === 'object') 
		{   
			/* this will remove the first match from the 
			the params */
			result.shift(); 
			matched = result; 
			/* this will get the uri params of the route 
			and if set will save them to the route */    
			this.setParams(result);
		}

		return matched;
	} 

	/**
	 * This will reset the params.
	 */
	resetParams()
	{
		this.stage = {};
	}
	
	/**
	 * This will set the params. 
	 * 
	 * @param {object} values 
	 */
	setParams(values)
	{ 
		if(values && typeof values === 'object') 
		{ 
			let keys = this.paramKeys;  
			if(keys) 
			{ 
				let params = {}; 
				for(var i = 0, maxL = keys.length; i < maxL; i++) 
				{ 
					var key = keys[i]; 
					if(typeof key !== 'undefined') 
					{ 
						params[key] = values[i]; 
					} 
				} 
				this.set(params);
			} 
		}
	}
	
	/**
	 * This will get the params. 
	 * 
	 * @return {object}
	 */
	getParams()
	{ 
		return this.stage; 
	}
}