/* base framework module */
(function()
{
	"use strict"; 
	
	/* this will update the page title */ 
	var updateTitle =  function(title) 
	{ 
		if(typeof title === 'string') 
		{ 
			document.title = title; 
		}
	}; 	
	
	/* this will check if the user is sending the title 
	by the state object because most browsers dont use 
	the current title param. 
	@param (string) title = the new title 
	@param (object) stateObj = the new state object */ 
	var getStateTitle = function(title, stateObj) 
	{ 
		return (title === null && (stateObj && stateObj.title))? stateObj.title : title;  
	}; 
	
	/* this will add and remove states from window history */ 
	base.extend.history = 
	{  
		/* this will check if history api is supported and if so 
		return true else return false */ 
		isSupported: function() 
		{ 
			if('history' in window && 'pushState' in window.history) 
			{ 
				return true; 
			} 
			else 
			{ 
				return false; 
			} 
		}, 
		
		/* this will add and event listener for window popstate. 
		@param (function) fn = the function to use as callback 
		@param [(bool)] capture = event capture */ 
		addEvent: function(fn, capture) 
		{ 
			/* this will check if the current state has a 
			title property to update thepage title */ 
			var popEvent = function(e) 
			{ 
				var state = e.state; 
				if(state && state.title) 
				{ 
					updateTitle(state.title); 
				} 
				
				fn(e); 
			}; 
			
			base.events.add('popstate', window, popEvent, capture, true, fn);  
		}, 
		
		/* this will remove and event listener for window popstate. 
		@param (function) fn = the function to use as callback 
		@param [(bool)] capture = event capture */ 
		removeEvent: function(fn, capture) 
		{ 
			base.off('popstate', window, fn, capture); 
		},
		
		/* this will add a state to the window history 
		@param (object) object = the state object 
		@param (string) title = the state page title 
		@param (string) url = the state url */  

		pushState: function(object, title, url)
		{  
			var history = window.history, 
			lastState = history.state; 
			
			/* we want to check if the object is not already
			the last saved state */ 
			if(!lastState || base.equals(lastState, object) === false) 
			{  
				title = getStateTitle(title, object); 
				updateTitle(title);
				
				/* we want to add the new state to the window history*/ 
				history.pushState(object, title, url);   
			} 
		}, 
		
		/* this will add a state to the window history 
		@param (object) object = the state object 
		@param (string) title = the state page title 
		@param (string) url = the state url */  
		replaceState: function(object, title, url)
		{  
			title = getStateTitle(title, object); 
			updateTitle(title); 
			
			/* we want to add the new state to the window history*/ 
			window.history.replaceState(object, title, url);   
		},
		
		/* this will go to the next state in the window history */ 
		nextState: function()
		{ 
			window.history.forward();  
		},  
		
		/* this will go to the previous state in the window history */ 
		prevState: function()
		{ 
			window.history.back();  
		}, 
		
		/* this will take you to a specified number in the history 
		index. 
		@param (int) indexNumber= the number to go to */ 
		goTo: function(indexNumber) 
		{ 
			window.history.go(indexNumber); 
		} 
	}; 
})();