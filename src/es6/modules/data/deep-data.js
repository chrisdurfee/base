import {BasicData} from './basic-data.js';
import {cloneObject} from './attrs.js';
import {DataUtils as utils} from './data-utils.js';
import {dataBinder} from '../data-binder/data-binder.js';

/**
 * Data
 * 
 * This will create a new data object that can be used to 
 * bind elements to values. 
 * @class
 * @augments BasicData
 */
export class Data extends BasicData
{ 
	/**
	 * This will setup the stage and attributes object. 
	 */
	setup()
	{
		this.attributes = {};
		this.stage = {};
	}

	/**
	 * This will update an attribute value. 
	 * 
	 * @protected
	 * @param {object} obj 
	 * @param {string} attr 
	 * @param {*} val 
	 */
	_updateAttr(obj, attr, val)
	{ 
		/* this will check if we need to update 
		deep nested data */ 
		if(utils.hasDeepData(attr))
		{ 
			let prop, 
			props = utils.getSegments(attr), 
			length = props.length, 
			end = length - 1; 

			for (var i = 0; i < length; i++)
			{
				prop = props[i]; 

				/* this will add the value to the last prop */ 
				if(i === end)
				{
					obj[prop] = val;
					break;  
				} 

				if (obj[prop] === undefined) 
				{
					/* this will check to setup a new object 
					or an array if the prop is a number */ 
					obj[prop] = isNaN(prop)? {} : []; 
				}
				obj = obj[prop];
			}
		} 
		else 
		{ 
			obj[attr] = val; 
		}
	} 

	/**
	 * This will set the attribute value.  
	 * 
	 * @protected
	 * @param {string} attr 
	 * @param {*} val 
	 * @param {object} committer 
	 * @param {boolean} stopMerge 
	 */
	_setAttr(attr, val, committer, stopMerge)
	{  
		/* this will check to update the model based on who 
		updated it. if the data binder updated the data only 
		the stage data is updated */ 
		if(!committer && stopMerge !== true)
		{ 
			/* this will update the attribute data because 
			it was updated outside the data binder */ 
			this._updateAttr(this.attributes, attr, val);
		}
		else 
		{ 
			if(this.dirty === false)
			{ 
				this.dirty = true;
			}
		}

		this._updateAttr(this.stage, attr, val);

		/* this will publish the data to the data binder 
		to update any ui elements that are subscribed */ 
		committer = committer || this;
		this._publish(attr, val, committer); 
	} 

	/**
	 * This will publish an update to the data binder. 
	 * 
	 * @protected
	 * @param {string} attr 
	 * @param {*} val 
	 * @param {*} committer 
	 */
	_publish(attr, val, committer)
	{ 
		this.publish(attr, val, committer);
	} 
	
	/**
	 * This will publish deep and simple data to the data binder. 
	 * 
	 * @protected
	 * @param {string} attr 
	 * @param {*} val 
	 * @param {object} committer 
	 */
	publishDeep(attr, val, committer)
	{ 
		if(utils.hasDeepData(attr))
		{ 
			let prop, 
			props = utils.getSegments(attr), 
			length = props.length, 
			end = length - 1; 

			/* the path is a string equivalent of the javascript dot notation path
			of the object being published. */ 
			let path = '', 
			obj = this.stage;
			for (var i = 0; i < length; i++)
			{
				prop = props[i];

				/* we need to setup the object to go to the next level 
				of the data object before calling the next property. */ 
				obj = obj[prop];
				
				if (i > 0)
				{
					/* this will add the property to the path based on if its an 
					object property or an array. */ 
					if(isNaN(prop))
					{
						path += '.' + prop;
					}
				} 
				else 
				{
					path = prop;
				}

				var publish;
				if(i === end)
				{
					/* if the loop is on the last pass it only needs to publish 
					the val. */
					publish = val; 
				}
				else 
				{
					/* we only want to publish the modified branches. we need to 
					get the next property in the props array and create a publish
					object or array with the next property value. */ 
					var nextProp = props[i + 1];
					if(isNaN(nextProp) === false)
					{
						path += '[' + nextProp + ']';
						continue;
					}
					
					var nextAttr = {};
					nextAttr[nextProp] = obj[nextProp];
					publish = nextAttr;
				}
				
				this.publish(path, publish, committer);
			}
		} 
		else 
		{ 
			this.publish(attr, val, committer); 
		}
	} 

	/**
	 * This will publish an update to the data binder. 
	 * 
	 * @protected
	 * @param {string} pathString 
	 * @param {*} obj 
	 * @param {*} committer 
	 */
	publish(pathString, obj, committer)
	{ 
		pathString = pathString || ""; 
		this._publishAttr(pathString, obj, committer);
		
		if(obj && typeof obj === 'object')
		{ 
			let subPath, value; 
			if(Array.isArray(obj))
			{ 
				let length = obj.length; 
				for(var i = 0; i < length; i++)
				{ 
					value = obj[i]; 
					subPath = pathString + '[' + i + ']';
					this._checkPublish(subPath, value, committer);
				}
			}
			else 
			{ 
				for(var prop in obj)
				{ 
					if(obj.hasOwnProperty(prop))
					{ 
						value = obj[prop]; 
						subPath = pathString + '.' + prop;
						this._checkPublish(subPath, value, committer);
					}
				}
			}
		} 
	} 
	
	_checkPublish(subPath, val, committer)
	{
		if(!val || typeof val !== 'object')
		{  
			this._publishAttr(subPath, val, committer);
		} 
		else 
		{ 
			this.publish(subPath, val, committer);
		}
	} 

	/**
	 * This will publish an update on an attribute. 
	 * 
	 * @protected
	 * @param {string} subPath 
	 * @param {*} val 
	 * @param {object} committer 
	 */
	_publishAttr(subPath, val, committer) 
	{
		/* save path and value */ 
		dataBinder.publish(this._dataId + subPath, val, committer);

		let message = subPath + ':change'; 
		this.eventSub.publish(message, val, committer);
	}

	/**
	 * This will merge the attribute with the stage. 
	 * @protected
	 */
	mergeStage()
	{ 
		/* this will clone the stage object to the 
		attribute object */ 
		this.attributes = cloneObject(this.stage); 
		this.dirty = false; 
	} 

	/**
	 * This will get the model data. 
	 */
	getModelData()
	{ 
		this.mergeStage(); 
		return this.attributes; 
	} 

	/**
	 * This will revert the stage back to the previous attributes. 
	 */
	revert() 
	{ 
		/* this will reset the stage to the previous 
		attributes */ 
		this.set(this.attributes); 
		this.dirty = false;
	} 

	/**
	 * This will delete an attribute. 
	 * 
	 * @param {object} obj 
	 * @param {string} attr 
	 * @return {*}
	 */
	_deleteAttr(obj, attr) 
	{ 
		if(utils.hasDeepData(attr))
		{ 
			let props = utils.getSegments(attr), 
			length = props.length, 
			end = length - 1; 

			for (var i = 0; i < length; i++)
			{
				var prop = props[i];
				var propValue = obj[prop];
				if (propValue !== undefined) 
				{
					if(i === end)
					{
						if(Array.isArray(obj))
						{
							obj.splice(prop, 1);
							break; 
						}
						
						delete obj[prop];
						break;
					}
					obj = propValue;
				} 
				else 
				{
					break;
				} 
			}
		} 
		else 
		{ 
			delete obj[attr]; 
		}
	}
	
	/**
	 * This will get the value of an attribute. 
	 * 
	 * @param {object} obj 
	 * @param {string} attr 
	 * @return {*}
	 */
	_getAttr(obj, attr) 
	{ 
		if(utils.hasDeepData(attr))
		{ 
			let props = utils.getSegments(attr), 
			length = props.length, 
			end = length - 1; 

			for (var i = 0; i < length; i++)
			{
				var prop = props[i];
				var propValue = obj[prop];
				if (propValue !== undefined) 
				{
					obj = propValue;

					if(i === end)
					{
						return obj; 
					}
				} 
				else 
				{
					break;
				} 
			}

			return undefined;
		} 
		else 
		{ 
			return obj[attr]; 
		}
	}
}