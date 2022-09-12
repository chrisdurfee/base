/* base framework module */ 
(function() 
{
	"use strict"; 
	
	/* 
		Component 
		
		this will allow components to be extend 
		from a single factory. 
		
		example: 
		
		var QuickFlashPanel = function()
		{ 
			// call super 
			Component.call(this);
		}; 
		
		base.Component.extend(
		{ 
			constructor: QuickFlashPanel
		}); 
		
		// or

		QuickFlashPanel.prototype = base.Component.extend(
		{ 
			constructor: QuickFlashPanel
		}); 
		
	*/ 
	var Component = function() 
	{ 
		this.init();
	}; 
	
	/* this will extedn the html builder to allow the 
	components to build */ 
	Component.prototype = base.extendClass( base.htmlBuilder, 
	{ 
		constructor: Component,

		/* this will setup the component number and unique 
		instance id for the component elements. 
		@param [(string)] overrideName = the component name to 
		override the constructor name */ 
		init: function(overrideName)
		{
			var constructor = this.constructor; 
			this.number = (typeof constructor.number === 'undefined')? constructor.number = 0 : (++constructor.number);
			
			var name = overrideName || constructor.name || this.componentTypeId; 
			this.id = name + this.number; 
		}, 
		
		bind: function(element, model, prop) 
		{ 
			if(element) 
			{ 
				base.DataBinder.bind(element, model, value);
			}
		}
	}); 
	
	var componentTypeNumber = 0; 

	/* this will allow the components to be extened. 
	@param (object) child = the child object to extend 
	@return (mixed) the new child prototype or false */ 
	Component.extend = function(child)
	{  
		/* the child constructor must be set to set 
		the parent static methods on the child */ 
		var constructor = child && child.constructor? child.constructor : false; 
		if(constructor)
		{ 
			/* this will add the parent class to the 
			child class */ 
			constructor.prototype = base.extendClass(this.prototype, child); 
			
			/* this will assign a unique id to the type of 
			component */ 
			constructor.prototype.componentTypeId = 'base-comp-' + (componentTypeNumber++); 

			/* this will add the static methods from the parent to 
			the child constructor. could use assign but ie doesn't 
			support it */ 
			//Object.assign(constructor, this);
			base.extendObject(this, constructor); 
			return constructor.prototype;
		} 
		return false; 
	}; 
	
	/* this will add a reference to the component 
	object */ 
	base.extend.component = base.extend.Component = Component; 
 
})();