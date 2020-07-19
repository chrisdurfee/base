import {base} from '../../core.js';

const updateTitle =  (title) =>
{ 
	if(typeof title === 'string') 
	{ 
		document.title = title; 
	}
}; 	

const getStateTitle = (title, stateObj) =>
{ 
	return (title === null && (stateObj && stateObj.title))? stateObj.title : title;  
}; 

export const history = 
{  
	isSupported() 
	{ 
		return ('history' in window && 'pushState' in window.history); 
	}, 
	
	addEvent(fn, capture) 
	{ 
		const popEvent = (e) =>
		{ 
			let state = e.state; 
			if(state && state.title) 
			{ 
				updateTitle(state.title); 
			} 
			
			fn(e); 
		}; 
		
		base.events.add('popstate', window, popEvent, capture, true, fn);  
	}, 
	
	removeEvent(fn, capture) 
	{ 
		base.off('popstate', window, fn, capture); 
	},
	
	pushState(object, title, url)
	{  
		const history = window.history, 
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
	
	replaceState(object, title, url)
	{  
		title = getStateTitle(title, object); 
		updateTitle(title); 
		
		/* we want to add the new state to the window history*/ 
		window.history.replaceState(object, title, url);   
	},
	
	/* this will go to the next state in the window history */ 
	nextState()
	{ 
		window.history.forward();  
	},  
	
	/* this will go to the previous state in the window history */ 
	prevState()
	{ 
		window.history.back();  
	}, 
	
	/* this will take you to a specified number in the history 
	index. 
	@param (int) indexNumber= the number to go to */ 
	goTo(indexNumber) 
	{ 
		window.history.go(indexNumber); 
	} 
};