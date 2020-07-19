/**
 * Utils
 * 
 * These are some helper functions for the router. 
 */
export const Utils = 
{ 
	/**
	 * This will remove the begining and ending slashes from a url. 
	 * 
	 * @param {string} uri 
	 * @return {string}
	 */
	removeSlashes(uri) 
	{ 
		if(typeof uri === 'string') 
		{ 
			if(uri.substr(0, 1) === '/')
			{
				uri = uri.substr(1); 
			}

			if(uri.substr(-1) === '/')
			{
				uri = uri.substr(0, uri.length - 1); 
			}
		} 

		return uri; 
	}
};