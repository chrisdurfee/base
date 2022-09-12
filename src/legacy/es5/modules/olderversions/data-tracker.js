/* base framework module */
(function()
{
	"use strict"; 
	
	var trackingCount = 0; 
	
	var TrackerTypes = 
	{
		types: {}, 
		
		add: function(type, callBack)
		{
			this.types[type] = callBack; 
		}, 
		
		get: function(type)
		{
			return this.types[type] || false; 
		}, 
		
		remove: function(type)
		{
			delete this.types[type]; 
		}
	}; 
	
	var Tracker = base.Class.extend(
	{
		constructor: function() 
		{  
			this.types = {};  
		}, 
		
		add: function(addingType, data)
		{
			var type = this.types[addingType] || (this.types[addingType] = []); 
			type.push(data);  
		}, 
		
		get: function(type)
		{
			return this.types[type] || false; 
		}, 
		
		removeByCallBack: function(callBack, data)
		{
			if(typeof callBack === 'function')
			{
				callBack(data); 
			}
		}, 
		
		removeType: function(removingType)
		{
			var types = this.types; 
			var type = types[removingType];
			if(type.length)
			{
				var callBack = TrackerTypes.get(removingType);
				for(var i = 0, length = type.length; i < length; i++)
				{
					var data = type[i]; 
					if(data)
					{
						// this will stop any circular referrences
						type[i] = null; 
						
						this.removeByCallBack(callBack, data); 
					}
				}
				delete types[type]; 
			}
		}, 
		
		remove: function(type)
		{
		 	if(type)
			{
				this.removeType(type); 
			} 
			else 
			{
				var types = this.types; 
				for(var prop in types)
				{ 
					if(types.hasOwnProperty(prop))
					{
						type = types[prop];
						if(!type)
						{
							continue; 
						}

						this.removeType(prop);
					} 
				}

				delete this.types;
			}
		}
	}); 
	
	var DataTracker = base.Class.extend(
	{ 
		constructor: function() 
		{  
			this.trackers = {};  
		},  
		
		addType: function(type, callBack)
		{
			TrackerTypes.add(type, callBack); 
		}, 
		
		removeType: function(type)
		{
			TrackerTypes.remove(type); 
		}, 
		
		getTrackingId: function(obj)
		{
			return obj.trackingId || (obj.trackingId = 'dt' + trackingCount++); 
		}, 
		
		add: function(obj, type, data)
		{
			var id = this.getTrackingId(obj); 
			var tracker = this.find(id); 
 
			tracker.add(type, data); 
		}, 
		
		get: function(obj, type)
		{
			var id = obj.trackingId; 
			var tracker = this.trackers[id]; 
			if(!tracker)
			{
				return false;  
			}
			
			return (type)? tracker.get(type) : tracker;
		}, 
		
		find: function(id)
		{
			var trackers = this.trackers; 
			return (trackers[id] || (trackers[id] = new Tracker()));
		}, 
		
		remove: function(obj, type)
		{
			var id = obj.trackingId;
			if(!id)
			{
				return true; 
			} 
			
			var tracker = this.trackers[id]; 
			if(!tracker)
			{
				return false; 
			}
				
			if(type)
			{
				tracker.remove(type); 

				/* this will remove the msg from the elements 
				if no elements are listed under the msg */ 
				if(base.isEmpty(tracker.types))
				{
					delete this.trackers[id]; 
				}
			} 
			else 
			{
				tracker.remove(); 

				delete this.trackers[id];
			}
		}
	}); 
	
	base.extend.DataTracker = new DataTracker(); 
})();