/* base framework module */
(function()
{
	"use strict";

	/**
	 * This will get the data attribute settings.
	 *
	 * @param {object} settings
	 * @return {object}
	 */
	var setupAttrSettings = function(settings)
	{
		var attributes = {};
		if(!settings && typeof settings !== 'object')
		{
			return attributes;
		}

		settings = base.cloneObject(settings);

		for(var prop in settings)
		{
			if(settings.hasOwnProperty(prop))
			{
				var setting = settings[prop];
				if(typeof setting !== 'function')
				{
					attributes[prop] = setting;
					delete settings[prop];
				}
			}
		}
		return attributes;
	};

	var DataUtils =
	{
		deepDataPattern: /(\w+)|(?:\[(\d)\))/g,

		/**
		 * This will check if a string has deep data.
		 *
		 * @param {string} str
		 * @return {bool}
		 */
		hasDeepData: function(str)
		{
			return (str.indexOf('.') !== -1 || str.indexOf('[') !== -1);
		},

		/**
		 * This will get the deep data segments
		 * @param {string} str
		 * @return {array}
		 */
		getSegments: function(str)
		{
			var pattern = this.deepDataPattern;
			return str.match(pattern);
		}
	};

	var BasicData = base.Class.extend(
	{
		isData: true,

		/**
		 * @constructor
		 * @param {object} [settings]
		 */
		constructor: function(settings)
		{
			this.dirty = false;
			this.links = {};

			this._init();
			this.setup();

			/* this will setup the event sub for
			one way binding */
			this.eventSub = new base.DataPubSub();

			/* this will set the construct attributes */
			var attributes = setupAttrSettings(settings);
			this.set(attributes);
		},

		setup: function()
		{
			this.stage = {};
		},

		/**
		 * @member {string} dataTypeId
		 */
		dataTypeId: 'bd',

		/**
		 * This will setup the number and unique id of the data object.
		 * @protected
		 */
		_init: function()
		{
			var constructor = this.constructor;
			this._dataNumber = (typeof constructor._dataNumber === 'undefined')? constructor._dataNumber = 0 : (++constructor._dataNumber);

			var dataId = this.dataTypeId + '-';
			this._id = dataId + this._dataNumber;
			this._dataId = this._id + ':';
		},

		/**
		 * This will get the data id.
		 * @return {string}
		 */
		getDataId: function()
		{
			return this._id;
		},

		/**
		 * This is a placeholder.
		 */
		remove: function()
		{

		},

		/**
		 * This will setup a one way bind.
		 *
		 * @param {string} attrName
		 * @param {function} callBack
		 * @return {string} The subscription token.
		 */
		on: function(attrName, callBack)
		{
			var message = attrName + ':change';
			var token = this.eventSub.on(message, callBack);
			return token;
		},

		/**
		 * This will unbind from a one way bind.
		 *
		 * @param {string} attrName
		 * @param {string} token
		 */
		off: function(attrName, token)
		{
			var message = attrName + ':change';
			this.eventSub.off(message, token);
		},

		/**
		 * This will set the attribute value.
		 *
		 * @protected
		 * @param {string} attr
		 * @param {*} val
		 * @param {object} committer
		 */
		_setAttr: function(attr, val, committer)
		{
			var prevValue = this.stage[attr];
			if(val === prevValue)
			{
				return false;
			}

			this.stage[attr] = val;

			committer = committer || this;

			/* this will publish the data to the data binder
			to update any ui elements that are subscribed */
			this._publish(attr, val, committer, prevValue);
		},

		/**
		 * This will set the data value of an attribute or attributes.
		 *
		 * @param {string} key
		 * @param {*} value
		 *
		 * or
		 *
		 * @param {object} data
		 * @return {object} this
		 */
		set: function()
		{
			var args = arguments;
			if(typeof args[0] === 'object')
			{
				var items = args[0],
				committer = args[1],
				stopMerge = args[2];

				for(var attr in items)
				{
					if(items.hasOwnProperty(attr))
					{
						var item = items[attr];
						if(typeof item === 'function')
						{
							continue;
						}
						this._setAttr(attr, item, committer, stopMerge);
					}
				}
			}
			else
			{
				this._setAttr(args[0], args[1], args[2], args[3]);
			}
			return this;
		},

		/**
		 * This will get the model data.
		 */
		getModelData: function()
		{
			return this.stage;
		},

		/**
		 * This will toggle a bool attribute.
		 *
		 * @param {string} attr
		 * @return {object} this
		 */
		toggle: function(attr)
		{
			if(typeof attr === 'undefined')
			{
				return;
			}

			this.set(attr, !this.get(attr));
			return this;
		},

		/**
		 * This will increment an attribute.
		 *
		 * @param {string} attr
		 * @return {object} this
		 */
		increment: function(attr)
		{
			if(typeof attr === 'undefined')
			{
				return;
			}

			var val = this.get(attr);
			this.set(attr, ++val);
			return this;
		},

		/**
		 * This will decrement an attribute.
		 *
		 * @param {string} attr
		 * @return {object} this
		 */
		decrement: function(attr)
		{
			if(typeof attr === 'undefined')
			{
				return;
			}

			var val = this.get(attr);
			this.set(attr, --val);
			return this;
		},

		/**
		 * This will set the key value if it is null.
		 *
		 * @param {string} key
		 * @param {mixed} value
		 * @return {object} this
		 */
		ifNull: function(key, value)
		{
			if(this.get(key) === null)
			{
				this.set(key, value);
			}
			return this;
		},

		/**
		 * This will set the data local storage key.
		 *
		 * @param {string} key
		 */
		setKey: function(key)
		{
			this.key = key;
		},

		/**
		 * This will restore the data from local storage.
		 *
		 * @param {mixed} defaultValue
		 * @returns {bool|void}
		 */
		resume: function(defaultValue)
		{
			var key = this.key;
			if(!key)
			{
				return false;
			}

			var data;
			var value = localStorage.getItem(key);
			if(value === null)
			{
				if(defaultValue)
				{
					data = defaultValue;
				}
			}
			else
			{
				data = JSON.parse(value);
			}

			this.set(data);
		},

		/**
		 * This will store the data to the local stoage under
		 * the storage key.
		 *
		 * @returns {bool|void}
		 */
		store: function()
		{
			var key = this.key;
			if(!key)
			{
				return false;
			}

			var data = this.get();
			if(!data)
			{
				return false;
			}

			var value = JSON.stringify(data);
			localStorage.setItem(key, value);
		},

		/**
		 * This will delete an attribute.
		 *
		 * @param {object} obj
		 * @param {string} attr
		 * @return {*}
		 */
		_deleteAttr: function(obj, attr)
		{
			delete obj[attr];
		},

		/**
		 * This will delete a property value or the model data.
		 *
		 * @param {string} [attrName]
		 * @return {*}
		 */
		delete: function(attrName)
		{
			if(typeof attrName !== 'undefined')
			{
				this._deleteAttr(this.stage, attrName);
				return;
			}

			// this will clear the stage and attributes
			this.setup();
		},

		/**
		 * This will get the value of an attribute.
		 *
		 * @param {object} obj
		 * @param {string} attr
		 * @return {*}
		 */
		_getAttr: function(obj, attr)
		{
			return obj[attr];
		},

		/**
		 * This will get a property value or the model data.
		 *
		 * @param {string} [attrName]
		 * @return {*}
		 */
		get: function(attrName)
		{
			if(typeof attrName !== 'undefined')
			{
				return this._getAttr(this.stage, attrName);
			}
			else
			{
				return this.getModelData();
			}
		},

		/**
		 * This will link a data source property to another data source.
		 *
		 * @param {object} data
		 * @param {string|object} attr
		 * @param {string} alias
		 * @return {string|array}
		 */
		 link: function(data, attr, alias)
		 {
			 // this will get the data source attrs if sending a whole data object
			 if(arguments.length === 1 && data.isData === true)
			 {
				 attr = data.get();
			 }

			 if(typeof attr !== 'object')
			 {
				 return this.remoteLink(data, attr, alias);
			 }

			 var tokens = [];
			 for(var prop in attr)
			 {
				 if(attr.hasOwnProperty(prop) === false)
				 {
					 continue;
				 }

				 tokens.push(this.remoteLink(data, prop));
			 }
			 return tokens;
		 },

		 /**
		  * This will link a remote data source by property.
		  *
		  * @param {object} data
		  * @param {string} attr
		  * @param {string} alias
		  * @return {string}
		  */
		 remoteLink: function(data, attr, alias)
		 {
			 var childAttr = alias || attr;
			 var value = data.get(attr);
			 if(typeof value !== 'undefined' && this.get(attr) !== value)
			 {
				 this.set(attr, value);
			 }

			 var self = this;
			 var token = data.on(attr, function(propValue, committer)
			 {
				 if(committer === self)
				 {
					 return false;
				 }

				 self.set(childAttr, propValue, data);
			 });

			 this.addLink(token, data);

			 var remoteToken = this.on(childAttr, function(propValue, committer)
			 {
				 if(committer === data)
				 {
					 return false;
				 }

				 data.set(attr, propValue, self);
			 });

			 data.addLink(remoteToken, this);
			 return token;
		 },

		 /**
		  * This will add a link token to the links array.
		  *
		  * @param {string} token
		  * @param {object} data
		  */
		 addLink: function(token, data)
		 {
			 this.links[token] = data;
		 },

		 /**
		  * This will remove a link or all links.
		  *
		  * @param {string} [token]
		  */
		 unlink: function(token)
		 {
			 if(token)
			 {
				 this.removeLink(token);
				 return;
			 }

			 var links = this.links;
			 if(links.length)
			 {
				 for(var i = 0, length = links.length; i < length; i++)
				 {
					 this.removeLink(links[i], false);
				 }
				 this.links = [];
			 }
		 },

		 /**
		  * This will remove the linked subscription.
		  *
		  * @param {string} token
		  * @param {bool} removeFromLinks
		  */
		 removeLink: function(token, removeFromLinks)
		 {
			 var data = this.links[token];
			 if(data)
			 {
				 data.off(token);
			 }

			 if(removeFromLinks === false)
			 {
				 return;
			 }

			 delete this.links[token];
		 }
	});

	var DataBinder = base.DataBinder;


	/**
	 * Data
	 *
	 * This will create a new data object that can be used to
	 * bind elements to values.
	 * @class
	 * @augments BasicData
	 */
	var Data = BasicData.extend(
	{
		/**
		 * This will setup the stage and attributes object.
		 */
		setup: function()
		{
			this.attributes = {};
			this.stage = {};
		},

		/**
		 * This will update an attribute value.
		 *
		 * @protected
		 * @param {object} obj
		 * @param {string} attr
		 * @param {*} val
		 */
		_updateAttr: function(obj, attr, val)
		{
			var utils = DataUtils;
			/* this will check if we need to update
			deep nested data */
			if(utils.hasDeepData(attr))
			{
				var prop,
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
		},

		/**
		 * This will set the attribute value.
		 *
		 * @protected
		 * @param {string} attr
		 * @param {*} val
		 * @param {object} committer
		 * @param {boolean} stopMerge
		 */
		_setAttr: function(attr, val, committer, stopMerge)
		{
			if(typeof val !== 'object' && val === this.get(attr))
			{
				return;
			}

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
		},

		/**
		 * This will link a data attr object to another data object.
		 *
		 * @param {object} data
		 * @param {string} attr
		 */
		linkAttr: function(data, attr)
		{
			var value = data.get(attr);
			if(value)
			{
				for(var prop in value)
				{
					if(value.hasOwnProperty(prop))
					{
						this.link(data, attr + '.' + prop, prop);
					}
				}
			}
		},

		/**
		 * This will create a new data source by scoping the parent
		 * data attr and linking the two sources.
		 *
		 * @param {string} attr
		 * @param {object} [constructor]
		 * @returns {object}
		 */
		scope: function(attr, constructor)
		{
			var value = this.get(attr);
			if(!value)
			{
				return false;
			}

			constructor = constructor || this.constructor;
			var data = new constructor(value);

			/* this will link the new data to the parent attr */
			data.linkAttr(this, attr);
			return data;
		},

		/**
		 * This will splice a value from an array and set
		 * the result.
		 *
		 * @param {string} attr
		 * @param {int} index
		 * @return {object} this
		 */
		splice: function(attr, index)
		{
			this.delete(attr + '[' + index + ']');
			this.refresh(attr);

			return this;
		},

		/**
		 * This will add a value to an array and set the result.
		 *
		 * @param {string} attr
		 * @param {mixed} value
		 * @return {object} this
		 */
		push: function(attr, value)
		{
			var currentValue = this.get(attr);
			if(Array.isArray(currentValue) === false)
			{
				currentValue = [];
			}

			currentValue.push(value);
			this.set(attr, currentValue);
			return this;
		},

		/**
		 * This will add a value to an array and set the result.
		 *
		 * @param {string} attr
		 * @param {mixed} value
		 * @return {object} this
		 */
		unshift: function(attr, value)
		{
			var currentValue = this.get(attr);
			if(Array.isArray(currentValue) === false)
			{
				currentValue = [];
			}

			currentValue.unshift(value);
			this.set(attr, currentValue);
			return this;
		},

		/**
		 * This will add a value to an array and set the result.
		 *
		 * @param {string} attr
		 * @return {mixed} this
		 */
		shift: function(attr)
		{
			var currentValue = this.get(attr);
			if(Array.isArray(currentValue) === false)
			{
				return null;
			}

			var value = currentValue.shift();
			this.set(attr, currentValue);
			return value;
		},

		/**
		 * This will pop the last value from an array and set the result.
		 *
		 * @param {string} attr
		 * @return {mixed}
		 */
		pop: function(attr)
		{
			var currentValue = this.get(attr);
			if(Array.isArray(currentValue) === false)
			{
				return null;
			}

			var value = currentValue.pop();
			this.set(attr, currentValue);
			return value;
		},

		/**
		 * This will refresh the value.
		 *
		 * @param {string} attr
		 * @return {object} this
		 */
		refresh: function(attr)
		{
			this.set(attr, this.get(attr));

			return this;
		},

		/**
		 * This will publish an update to the data binder.
		 *
		 * @protected
		 * @param {string} attr
		 * @param {*} val
		 * @param {*} committer
		 */
		_publish: function(attr, val, committer)
		{
			this.publish(attr, val, committer);
		},

		/**
		 * This will publish deep and simple data to the data binder.
		 *
		 * @protected
		 * @param {string} attr
		 * @param {*} val
		 * @param {object} committer
		 */
		publishDeep: function(attr, val, committer)
		{
			var utils = DataUtils;
			if(utils.hasDeepData(attr))
			{
				var prop,
				props = utils.getSegments(attr),
				length = props.length,
				end = length - 1;

				/* the path is a string equivalent of the javascript dot notation path
				of the object being published. */
				var path = '',
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
		},

		/**
		 * This will publish an update to the data binder.
		 *
		 * @protected
		 * @param {string} pathString
		 * @param {*} obj
		 * @param {*} committer
		 */
		publish: function(pathString, obj, committer)
		{
			pathString = pathString || "";
			this._publishAttr(pathString, obj, committer);

			if(obj && typeof obj === 'object')
			{
				var subPath, value;
				if(Array.isArray(obj))
				{
					var length = obj.length;
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
		},

		_checkPublish: function(subPath, val, committer)
		{
			if(!val || typeof val !== 'object')
			{
				this._publishAttr(subPath, val, committer);
			}
			else
			{
				this.publish(subPath, val, committer);
			}
		},

		/**
		 * This will publish an update on an attribute.
		 *
		 * @protected
		 * @param {string} subPath
		 * @param {*} val
		 * @param {object} committer
		 */
		_publishAttr: function(subPath, val, committer)
		{
			/* save path and value */
			DataBinder.publish(this._dataId + subPath, val, committer);

			var message = subPath + ':change';
			this.eventSub.publish(message, val, committer);
		},

		/**
		 * This will merge the attribute with the stage.
		 * @protected
		 */
		mergeStage: function()
		{
			/* this will clone the stage object to the
			attribute object */
			this.attributes = base.cloneObject(this.stage);
			this.dirty = false;
		},

		/**
		 * This will get the model data.
		 */
		getModelData: function()
		{
			this.mergeStage();
			return this.attributes;
		},

		/**
		 * This will revert the stage back to the previous attributes.
		 */
		revert: function()
		{
			/* this will reset the stage to the previous
			attributes */
			this.set(this.attributes);
			this.dirty = false;
		},

		/**
		 * This will delete an attribute.
		 *
		 * @param {object} obj
		 * @param {string} attr
		 * @return {*}
		 */
		_deleteAttr: function(obj, attr)
		{
			var utils = DataUtils;
			if(utils.hasDeepData(attr))
			{
				var props = utils.getSegments(attr),
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
							if(base.isArray(obj))
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
		},

		/**
		 * This will get the value of an attribute.
		 *
		 * @param {object} obj
		 * @param {string} attr
		 * @return {*}
		 */
		_getAttr: function(obj, attr)
		{
			var utils = DataUtils;
			if(utils.hasDeepData(attr))
			{
				var props = utils.getSegments(attr),
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
	});

	var DeepData = Data.extend(
	{
		/**
		 * This will publish an update to the data binder.
		 *
		 * @protected
		 * @param {string} attr
		 * @param {*} val
		 * @param {*} committer
		 */
		_publish: function(attr, val, committer)
		{
			this.publishDeep(attr, val, committer);
		}
	});

	base.DeepData = DeepData;

	/**
	 * SimpleData
	 *
	 * This will extend Data to add a simple data object
	 * that doesn't allow deep nested data.
	 * @class
	 * @augments BasicData
	 */
	var SimpleData = BasicData.extend(
	{
		/**
		 * This will publish an update to the data binder.
		 *
		 * @override
		 * @protected
		 * @param {string} attr
		 * @param {*} val
		 * @param {*} committer
		 * @param {*} prevValue
		 */
		_publish: function(attr, val, committer, prevValue)
		{
			var message = attr + ':change';
			this.eventSub.publish(message, val, committer);

			committer = committer || this;

			DataBinder.publish(this._dataId + attr, val, committer);
		}
	});

	base.extend.Data = Data;
	base.extend.SimpleData = SimpleData;

	/**
	 * Model
	 *
	 * This will extend Data to add a model that can specify
	 * a service that connects to a remote source.
	 */
	var Model = Data.extend(
	{
		/**
		 * @constructor
		 * @param {object} [settings]
		 */
		constructor: function(settings)
		{
			Data.call(this, settings);

			this.initialize();

			/**
			 * @member {object} xhr The model service.
			 */
			this.xhr = null;
		},

		/**
		 * This adds a method to call if you want the model
		 * to do something when its initialized.
		 */
		initialize: function()
		{

		}
	});

	/**
	 * This will get the defaults from the settings.
	 *
	 * @param {object} settings
	 * @return {object}
	 */
	var setupDefaultAttr = function(settings)
	{
		var attributes = {};
		if(!settings || typeof settings !== 'object')
		{
			return attributes;
		}

		var defaults = settings.defaults;
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
	var getXhr = function(settings)
	{
		if(!settings || typeof settings.xhr !== 'object')
		{
			return {};
		}

		var settingsXhr = settings.xhr,
		xhr = base.createObject(settingsXhr);
		delete settings.xhr;
		return xhr;
	};

	/* this will track the number of model types */
	var modelTypeNumber = 0;

	/**
	 * This will extend the model to a child model.
	 *
	 * @static
	 * @param {object} settings
	 * @return {object} The new model.
	 */
	Model.extend = function(settings)
	{
		var parent = this,
		xhr = getXhr(settings),
		modelService = this.prototype.xhr.extend(xhr);

		settings = settings || {};

		/* this will setup the default attribute settings for
		the model */
		var defaultAttributes = setupDefaultAttr(settings),
		model = function(instanceSettings)
		{
			/* this will get the instance attributes that
			the model will set as attribute data */
			var instanceAttr = setupAttrSettings(instanceSettings);

			/* we want to extend the default attr with the
			instance attr before we set the data and call
			the parent constructor */
			instanceAttr = base.extendObject(defaultAttributes, instanceAttr);
			parent.call(this, instanceAttr);

			/* this will setup the model service and
			pass the new model instance to the service */
			this.xhr = new modelService(this);
		};

		/* this will extend the model and add the static
		methods to the new object */
		var extended = model.prototype = base.extendClass(this.prototype, settings);
		extended.constructor = model;
		extended.xhr = modelService;

		/* this will assign a unique id to the model type */
		extended.dataTypeId = 'bm' + (modelTypeNumber++);

		/* this will extend the static methods */
		base.extendObject(parent, model);
		return model;
	};

	base.extend.Model = Model;

	/**
	 * ModelService
	 *
	 * This will create a new model service.
	 * @class
	 */
	var ModelService = base.Class.extend(
	{
		/**
		 * @constructor
		 * @param {object} model
		 */
		constructor: function(model)
		{
			/**
			 * @member {object} model
			 */
			this.model = model;

			this.url = '';
			this.init();
		},

		init: function()
		{
			var model = this.model;
			if(model && model.url)
			{
				this.url = model.url;
			}
		},

		validateCallBack: null,

		/**
		 * This will check if the model is valid.
		 *
		 * @return {boolean}
		 */
		isValid: function()
		{
			var result = this.validate();
			if(result !== false)
			{
				var callBack = this.validateCallBack;
				if(typeof callBack === 'function')
				{
					callBack(result);
				}
			}
			return result;
		},

		/**
		 * This should be overriden to validate the model
		 * before submitting.
		 *
		 * @return {boolean}
		 */
		validate: function()
		{
			return true;
		},

		/**
		 * This can be overriden to add default params
		 * with each request.
		 *
		 * @protected
		 * @return {string}
		 */
		getDefaultParams: function()
		{
			return '';
		},

		/**
		 * This will setup the request params.
		 *
		 * @protected
		 * @param {(string|object)} params
		 * @return {(string|object)}
		 */
		setupParams: function(params)
		{
			var defaults = this.getDefaultParams();
			params = this.addParams(params, defaults);
			return params;
		},

		/**
		 * This will convert an object to a string.
		 *
		 * @protected
		 * @param {object} object
		 * @return {string}
		 */
		objectToString: function(object)
		{
			var params = [];
			for (var prop in object)
			{
				if(object.hasOwnProperty(prop))
				{
					params.push(prop + '=' + object[prop]);
				}
			}
			return params.join('&');
		},

		/**
		 * This will add the params.
		 *
		 * @protected
		 * @param {*} params
		 * @param {*} addingParams
		 * @return {(string|object)}
		 */
		addParams: function(params, addingParams)
		{
			params = params || {};
			if(typeof params === 'string')
			{
				params = base.parseQueryString(params, false);
			}

			if(!addingParams)
			{
				return this.objectToString(params);
			}

			if(typeof addingParams === 'string')
			{
				addingParams = base.parseQueryString(addingParams, false);
			}

			if(this._isFormData(params))
			{
				for(var key in addingParams)
				{
					if(addingParams.hasOwnProperty(key))
					{
						params.append(key, addingParams[key]);
					}
				}
			}
			else
			{
				params = base.extendObject(params, addingParams);
				params = this.objectToString(params);
			}

			return params;
		},

		/**
		 * @member {string} objectType The return type.
		 */
		objectType: 'item',

		/**
		 * This will get the model by id.
		 *
		 * @param {string} [instanceParams]
		 * @param {function} [callBack]
		 * @return {object}
		 */
		get: function(instanceParams, callBack)
		{
			var id = this.model.get('id'),
			params = 'op=get' +
						 '&id=' + id;

			var model = this.model,
			self = this;
			return this._get('', params, instanceParams, callBack, function(response)
			{
				if(response)
				{
					/* this will update the model with the get request
					response */
					var object = self.getObject(response);
					if(object)
					{
						model.set(object);
					}
				}
			});
		},

		/**
		 * This will get the object from the response.
		 *
		 * @protected
		 * @param {object} response
		 * @return {object}
		 */
		getObject: function(response)
		{
			/* this will update the model with the get request
			response */
			var object = response[this.objectType] || response;
			return object || false;
		},

		/**
		 * This will return a string with the model data json encoded.
		 *
		 * @protected
		 * @return {string}
		 */
		setupObjectData: function()
		{
			var item = this.model.get();
			return this.objectType + '=' + base.prepareJsonUrl(item);
		},

		/**
		 * This will add or update the model.
		 *
		 * @param {string} [instanceParams]
		 * @param {function} [callBack]
		 * @return {object}
		 */
		setup: function(instanceParams, callBack)
		{
			if(!this.isValid())
			{
				return false;
			}

			var params = 'op=setup' +
						 '&' + this.setupObjectData();

			/* this will add the instance params with the
			method params */
			params = this.addParams(params, instanceParams, instanceParams);

			return this._put('', params, callBack);
		},

		/**
		 * This will add the model.
		 *
		 * @param {string} [instanceParams]
		 * @param {function} [callBack]
		 * @return {object}
		 */
		add: function(instanceParams, callBack)
		{
			if(!this.isValid())
			{
				return false;
			}

			var params = 'op=add' +
						 '&' + this.setupObjectData();

			return this._post('', params, instanceParams, callBack);
		},

		/**
		 * This will update the model.
		 *
		 * @param {string} [instanceParams]
		 * @param {function} [callBack]
		 * @return {object}
		 */
		update: function(instanceParams, callBack)
		{
			if(!this.isValid())
			{
				return false;
			}

			var params = 'op=update' +
						 '&' + this.setupObjectData();

			return this._patch('', params, instanceParams, callBack);
		},

		/**
		 * This will delete the model.
		 *
		 * @param {string} [instanceParams]
		 * @param {function} [callBack]
		 * @return {object}
		 */
		delete: function(instanceParams, callBack)
		{
			var id = this.model.get('id'),
			params = 'op=delete' +
						 '&id=' + id;

			return this._delete('', params, instanceParams, callBack);
		},

		/**
		 * This will list rows of the model.
		 *
		 * @param {string} [instanceParams]
		 * @param {function} [callBack]
		 * @param {int} start
		 * @param {int} count
		 * @param {string} filter
		 * @return {object}
		 */
		all: function(instanceParams, callBack, start, count, filter)
		{
			filter = filter || '';
			start = !isNaN(start)? start : 0;
			count = !isNaN(count)? count : 50;

			var params = 'op=all' +
						 '&option=' + filter +
						 '&start=' + start +
						 '&stop=' + count;

			return this._get('', params, instanceParams, callBack);
		},

		getUrl: function(url)
		{
			var baseUrl = this.url;
			if(!url)
			{
				return baseUrl;
			}

			if(url[0] === '?')
			{
				return baseUrl + url;
			}

            return baseUrl += '/' + url;
		},

		/**
		 * This will make an ajax request.
		 *
		 * @param {string} url
		 * @param {string} method
		 * @param {(string|object)} params
		 * @param {function} callBack
		 * @param {function} [requestCallBack]
		 * @param {object}
		 */
		setupRequest: function(url, method, params, callBack, requestCallBack)
		{
			var self = this,
			settings = {
				url: this.getUrl(url),
				method: method,
				params: params,
				completed: function(response, xhr)
				{
					if(typeof requestCallBack === 'function')
					{
						requestCallBack(response);
					}

					self.getResponse(response, callBack, xhr);
				}
			};

			var overrideHeader = this._isFormData(params);
			if(overrideHeader)
			{
				settings.headers = {};
			}

			return base.ajax(settings);
		},

		_isFormData: function(data)
		{
			return data instanceof FormData;
		},

		/**
		 * This will make an ajax request.
		 *
		 * @param {(string|object)} params
		 * @param {string} instanceParams
		 * @param {function} callBack
		 * @param {function} [requestCallBack]
		 * @param {object}
		 */
		request: function(params, instanceParams, callBack, requestCallBack)
		{
			return this._request('', 'POST', params, instanceParams, callBack, requestCallBack);
		},

		/**
		 * This will make a GET request.
		 *
		 * @param {string} url
		 * @param {(string|object)} params
		 * @param {string} instanceParams
		 * @param {function} callBack
		 * @param {function} [requestCallBack]
		 * @param {object}
		 */
		_get: function(url, params, instanceParams, callBack, requestCallBack)
		{
			params = this.setupParams(params);
            params = this.addParams(params, instanceParams);

			url = url || '';

			if(params)
			{
				url += '?' + params;
			}

            return this.setupRequest(url, "GET", '', callBack, requestCallBack);
		},

		/**
		 * This will make a POST request.
		 *
		 * @param {string} url
		 * @param {(string|object)} params
		 * @param {string} instanceParams
		 * @param {function} callBack
		 * @param {function} [requestCallBack]
		 * @param {object}
		 */
		_post: function(url, params, instanceParams, callBack, requestCallBack)
		{
			return this._request(url, 'POST', params, instanceParams, callBack, requestCallBack);
		},

		/**
		 * This will make a PUT request.
		 *
		 * @param {string} url
		 * @param {(string|object)} params
		 * @param {string} instanceParams
		 * @param {function} callBack
		 * @param {function} [requestCallBack]
		 * @param {object}
		 */
		_put: function(url, params, instanceParams, callBack, requestCallBack)
		{
			return this._request(url, 'PUT', params, instanceParams, callBack, requestCallBack);
		},

		/**
		 * This will make a PATCH request.
		 *
         * @param {string} url
		 * @param {(string|object)} params
		 * @param {string} instanceParams
		 * @param {function} callBack
		 * @param {function} [requestCallBack]
		 * @param {object}
		 */
		_patch: function(url, params, instanceParams, callBack, requestCallBack)
		{
			return this._request(url, 'PATCH', params, instanceParams, callBack, requestCallBack);
		},

		/**
		 * This will make a DELETE request.
		 *
		 * @param {string} url
		 * @param {(string|object)} params
		 * @param {string} instanceParams
		 * @param {function} callBack
		 * @param {function} [requestCallBack]
		 * @param {object}
		 */
		_delete: function(url, params, instanceParams, callBack, requestCallBack)
		{
			return this._request(url, 'DELETE', params, instanceParams, callBack, requestCallBack);
		},

		/**
		 * This will make an ajax request.
		 *
		 * @param {string} url
		 * @param {string} method
		 * @param {(string|object)} params
		 * @param {string} instanceParams
		 * @param {function} callBack
		 * @param {function} [requestCallBack]
		 * @param {object}
		 */
		_request: function(url, method, params, instanceParams, callBack, requestCallBack)
		{
			params = this.setupParams(params);
			params = this.addParams(params, instanceParams);

			return this.setupRequest(url, method, params, callBack, requestCallBack);
		},

		getResponse: function(response, callBack, xhr)
		{
			/* this will check to return the response
			to the callBack function */
			if(typeof callBack === 'function')
			{
				callBack(response, xhr);
			}
		}
	});

	/* we need to add the service object to the
	model prototype as the xhr service */
	Model.prototype.xhr = ModelService;
})();