/* base framework module */
/*
	this will create a layout parser object
	and shortcut functions.
*/
(function()
{
	"use strict"; 

	/*
		LayoutParser

		this will parse json object layouts and
		use the basehtmlBuilder to render the layout
		in html.
	*/
	var LayoutParser = function() { };

	LayoutParser.prototype = base.extendClass(base.htmlBuilder,
	{
		constructor: LayoutParser,

		/* this will parse a layout object.
		@param (object) obj
		@param (mixed) parent = a parent element
		object or parent id string
		@return (object) a reference to the object */
		parseLayout: function(obj, parent)
		{
			if (typeof parent !== 'object')
			{
				parent = document.getElementById(parent);
			}

			if (obj && typeof obj !== 'object' && parent && typeof parent !== 'object')
			{
				return false;
			}

			var fragment = this.createDocFragment();
			
			if (base.isArray(obj))
			{
				for (var i = 0, length = obj.length; i < length; i++)
				{
					var item = obj[i];
					this.parseElement(item, fragment);
				}
			} 
			else
			{
				this.parseElement(obj, fragment);
			}
			parent.appendChild(fragment);

			return this;
		},

		/* this will parse a layout element.
		@param (object) obj
		@param (mixed) parent = a parent element
		object or parent id string */
		parseElement: function(obj, parent)
		{
			var settings = this.getElementSettings(obj);
			var ele = this.create(settings.node, settings.attr, parent); 
			if(typeof obj.onCreated === 'function') 
			{ 
				obj.onCreated(ele); 
			} 
			
			/* this will check to bind the element to 
			the prop of a model */ 
			var bind = obj.bind;
			if(bind && typeof bind === 'object')
			{ 
				base.DataBinder.bind(ele, bind.model, bind.prop); 
			}

			/* we want to recursively add the children to
			the new element */
			var children = settings.children;
			if (children.length > 0)
			{
				for (var i = 0, length = children.length; i < length; i++)
				{
					var child = children[i];
					this.parseElement(child, ele);
				}
			}
		},

		getElementNode: function(obj)
		{
			var nodeType = 'div';

			if (typeof obj.node !== 'undefined')
			{
				nodeType = obj.node;
			}

			return nodeType;
		},

		/* this will get the nodeType, attr, and children
		from an element. children can be an array of
		children or an element object.
		@param (object) obj
		@return (object) the attr settings */
		getElementSettings: function(obj)
		{
			var attr = {},
			children = [];

			for (var key in obj)
			{
				if (obj.hasOwnProperty(key))
				{
					if (key === 'node' || key === 'onCreated' || key === 'bind')
					{
						continue;
					}

					var value = obj[key];
					/* we need to filter the children from the attr
					settings. the children need to keep their order. */
					if (key !== 'children' && typeof value !== 'object')
					{
						attr[key] = value;
					}
					else
					{
						if (key === 'children')
						{
							children = children.concat(value);
						}
						else
						{
							children.push(value);
						}
					}
				}
			}

			var node = this.getElementNode(obj); 
			if(node === 'button') 
			{ 
				attr.type = 'button'; 
			} 
			
			return {
				node: this.getElementNode(obj),
				attr: attr,
				children: children
			};
		}
	});

	/* this will add a reference to the layout parser
	and add a shortcut method to parse lyout objects */
	base.extend.layoutParser = new LayoutParser();

	/* this will parse a layout object.
	@param (object) obj
	@param (mixed) parent = a parent element
	object or parent id string
	@return (object) a reference to the object */
	base.extend.parseLayout = function(obj, parent)
	{
		base.layoutParser.parseLayout(obj, parent);
	};
})();