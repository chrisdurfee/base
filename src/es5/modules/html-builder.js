/* base framework module */
/*
	this will create dynamic html to be
	added and modified
*/
(function()
{
	"use strict";

	var DataTracker = base.DataTracker,
	DataBinder = base.DataBinder;

	/**
	 * This will get the javascript property name.
	 *
	 * @param {string} prop
	 * @return {string}
	 */
	var filterProperty = function(prop)
	{
		switch(prop)
		{
			case 'class':
				prop = 'className';
				break;
			case 'text':
				prop = 'textContent';
				break;
			case 'for':
				prop = 'htmlFor';
				break;
			case 'readonly':
				prop = 'readOnly';
				break;
			case 'maxlength':
				prop = 'maxLength';
				break;
			case 'cellspacing':
				prop = 'cellSpacing';
				break;
			case 'rowspan':
				prop = 'rowSpan';
				break;
			case 'colspan':
				prop = 'colSpan';
				break;
			case 'tabindex':
				prop = 'tabIndex';
				break;
			case 'cellpadding':
				prop = 'cellPadding';
				break;
			case 'usemap':
				prop = 'useMap';
				break;
			case 'frameborder':
				prop = 'frameBorder';
				break;
			case 'contenteditable':
				prop = 'contentEditable';
				break;
		}

		return prop;
	};

	/**
	 * This will remove on from a property.
	 *
	 * @param {string} prop
	 * @return {string}
	 */
	var removePrefix = function(prop)
	{
		if(typeof prop === 'string' && prop.substring(0, 2) === 'on')
		{
			return prop.substring(2);
		}
		return prop;
	};

	/**
	 * htmlBuilder
	 *
	 * This will create an html builder object that can create
	 * and remove dom elements.
	 * @class
	 */
	var htmlBuilder = base.Class.extend(
	{
		/**
		 * @constructor
		 */
		constructor: function()
		{

		},

		/**
		 * This will create a new element.
		 *
		 * @param {string} nodeName The node name.
		 * @param {object} attrObject The node attributes.
		 * @param {object} container The node container.
		 * @param {boolean} [prepend=false] Add to the begining of the container.
		 * @return {object} The new element.
		 */
		create: function(nodeName, attrObject, container, prepend)
		{
			var obj = document.createElement(nodeName);
			this._addElementAttrs(obj, attrObject);

			/* we want to check if the new element should be
			added to the begining or end */
			if(prepend === true)
			{
				this.prepend(container, obj);
			}
			else
			{
				this.append(container, obj);
			}
			return obj;
		},

		/**
		 * This will add the element attributes.
		 *
		 * @protected
		 * @param {object} obj
		 * @param {object} attrObject
		 */
		_addElementAttrs: function(obj, attrObject)
		{
			/* we want to check if we have attrributes to add */
			if(!attrObject || typeof attrObject !== 'object')
			{
				return false;
			}

			/* we need to add the type if set to stop ie
			from removing the value if set after the value is
			added */
			var type = attrObject.type;
			if(typeof type !== 'undefined')
			{
				base.setAttr(obj, 'type', type);
			}

			/* we want to add each attr to the obj */
			for(var prop in attrObject)
			{
				/* we have already added the type so we need to
				skip if the prop is type */
				if(attrObject.hasOwnProperty(prop) === false || prop === 'type')
				{
					continue;
				}

				var attrPropValue = attrObject[prop];

				/* we want to check to add the attr settings
				 by property name */
				if(prop === 'innerHTML')
				{
					obj.innerHTML = attrPropValue;
				}
				else if(prop.substr(4, 1) === '-')
				{
					// this will handle data and aria attributes
					base.setAttr(obj, prop, attrPropValue);
				}
				else
				{
					this.addAttr(obj, prop, attrPropValue);
				}
			}
		},

		/**
		 * This will add html to an element.
		 *
		 * @param {object} obj
		 * @param {string} content
		 */
		addHtml: function(obj, content)
		{
			if(typeof content !== 'undefined' && content !== '')
			{
				/* we need to check if we are adding inner
				html content or just a string */
				var pattern = /(?:<[a-z][\s\S]*>)/i;
				if(pattern.test(content))
				{
					/* html */
					obj.innerHTML = content;
				}
				else
				{
					/* string */
					obj.textContent = content;
				}
			}
		},

		/**
		 * This will add an element attribute.
		 *
		 * @param {object} obj
		 * @param {object} attr
		 * @param {string} value
		 */
		addAttr: function(obj, attr, value)
		{
			if(value === '' || !attr)
			{
				return false;
			}

			/* we want to check to add a value or an event listener */
			var type = typeof value;
			if(type === 'function')
			{
				/* this will add the event using the base events
				so the event is tracked */
				attr = removePrefix(attr);
				base.addListener(attr, obj, value);
			}
			else
			{
				var attrName = filterProperty(attr);
				obj[attrName] = value;
			}
		},

		/**
		 * This will create a doc fragment.
		 *
		 * @return {object}
		 */
		createDocFragment: function()
		{
			return document.createDocumentFragment();
		},

		/**
		 * This will create a text node.
		 *
		 * @param {string} text
		 * @param {object} container
		 * @return {object}
		 */
		createTextNode: function(text, container)
		{
			var obj = document.createTextNode(text);

			if(container)
			{
				this.append(container, obj);
			}
			return obj;
		},

		/**
		 * This will create the options on a select.
		 *
		 * @param {object} selectElem
		 * @param {array} optionArray
		 * @param {string} [defaultValue]
		 */
		setupSelectOptions: function(selectElem, optionArray, defaultValue)
		{
			if(!selectElem || typeof selectElem !== 'object')
			{
				return false;
			}

			if(!optionArray || !optionArray.length)
			{
				return false;
			}

			/* create each option then add it to the select */
			for(var n = 0, maxLength = optionArray.length; n < maxLength; n++)
			{
				var settings = optionArray[n];
				var option = selectElem.options[n] = new Option(settings.label, settings.value);

				/* we can select an option if a default value
				has been sumbitted */
				if(defaultValue !== null && option.value == defaultValue)
				{
					option.selected = true;
				}
			}
		},

		/**
		 * This will remove an elements data.
		 *
		 * @param {object} ele
		 */
		removeElementData: function(ele)
		{
			/* we want to do a recursive remove child
			removal */
			var children = ele.childNodes;
			if(children)
			{
				var length = children.length - 1;
				for(var i = length; i >= 0; i--)
				{
					var child = children[i];
					if(child)
					{
						/* this will remove the child element data
						before the parent is removed */
						this.removeElementData(child);
					}
				}
			}

			DataTracker.remove(ele);

			var bound = ele.bindId;
			if(bound)
			{
				/* this will check to remove any data bindings
				to the element */
				DataBinder.unbind(ele);
			}
		},

		/**
		 * This will remove an element and its data.
		 *
		 * @param {object} obj
		 */
		removeElement: function(obj)
		{
			var container;

			if(!obj || !(container = obj.parentNode))
			{
				return this;
			}

			/* this will remove all element data and binding
			and remove from the parent container */
			this.removeElementData(obj);
			container.removeChild(obj);

			return this;
		},

		/**
		 * This will remove an element.
		 *
		 * @param {object} child
		 */
		removeChild: function(child)
		{
			this.removeElement(child);
		},

		/**
		 * This will remove all elements from the container.
		 *
		 * @param {object} container
		 */
		removeAll: function(container)
		{
			if(typeof container === 'object')
			{
				var children = container.childNodes;
				for(var child in children)
				{
					if(children.hasOwnProperty(child))
					{
						this.removeElementData(children[child]);
					}
				}
				container.innerHTML = '';
			}
		},

		/**
		 * This change the parent of an element.
		 *
		 * @param {object} child
		 * @param {object} newParent
		 */
		changeParent: function(child, newParent)
		{
			if(typeof child === 'string')
			{
				child = document.getElementById(child);
			}

			var container = (typeof newParent === 'string')? document.getElementById(newParent) : newParent;
			container.appendChild(child);
		},

		/**
		 * This will append a child element.
		 *
		 * @param {object} parent
		 * @param {object} child
		 */
		append: function(parent, child)
		{
			switch(typeof parent)
			{
				case "object":
					break;
				case "string":
					parent = document.getElementById(parent);
					break;
				case "undefined":
					parent = document.body;
					break;
			}

			parent.appendChild(child);
		},

		/**
		 * This will prepend a child element.
		 *
		 * @param {object} parent
		 * @param {object} child
		 * @param {object} [optionalNode]
		 */
		prepend: function(parent, child, optionalNode)
		{
			switch(typeof parent)
			{
				case "object":
					break;
				case "string":
					parent = document.getElementById(parent);
					break;
				case "undefined":
					parent = document.body;
					break;
			}

			var node = optionalNode || parent.firstChild;
			parent.insertBefore(child, node);
		},

		/**
		 * This will clone an element.
		 *
		 * @param {object} node
		 * @param {boolean} deepCopy
		 * @return {object}
		 */
		clone: function(node, deepCopy)
		{
			if(!node || typeof node !== 'object')
			{
				return false;
			}

			deepCopy = deepCopy || false;
			return node.cloneNode(deepCopy);
		}
	});

	/* we want to use a few private functions to add input selection
	to an element and reduce any closures */
	/**
	 * This will focus an element.
	 *
	 * @param {object} e
	 */
	var focusElement = function(e)
	{
		e = e || window.event;
		var src = e.srcElement || e.target;
		src.select();
	};

	base.extend.htmlBuilder = htmlBuilder;

})();