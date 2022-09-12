import {Animation} from './animation.js';

/*
	AnimationController

	this will create an animation controller object
	that will animate a target property or properties
	on an element over a duration.

	@param (object) settings = the animation settings
	@param [(function)] callBack = the function to call back
	when the animation is done
*/
export class AnimationController
{
	constructor(settings, callBack)
	{
		/* this is the delay of the animation in milliseconds */
		this.delay = settings.delay || 0;
		this.delayTimer = null;
		this.startTime = null;

		/* this is the animation duration in milliseconds */
		this.duration = settings.duration || 0;

		this.element = this.getElement(settings.element);
		this.status = 'stopped';
		this.animation = null;

		/* this will be the call back function to return
		when the animation is complete or errors */
		this.callBack = callBack;

		/* this will setup the fps */
		this.fps = settings.fps || 60;

		/* this will setup the new animation object and start
		the animation if all is correct or stop and return an
		error */
		this.setup(settings);
	}

	setup(settings)
	{
		this.animationCallBack = this.animate.bind(this);

		let element = this.element;
		if(typeof element === 'object')
		{
			/* we want to start the animation by the animation
			delay settings */
			let callBack = this.setupAnimation.bind(this, element, settings);
			this.delayTimer = window.setTimeout(callBack, this.delay);
		}
		else
		{
			/* we do not have an element or property to
			animate so we wantto return an error */
			this.updateStatus('error');
		}
		return this;
	}

	setupAnimation(element, settings)
	{
		this.animation = new Animation(element, settings);
		this.start(settings);
	}

	/* this will start the animation by getting the start time
	and starting the animation timer */
	start()
	{
		/* this will track the time passed and the progress
		of the animation */
		this.startTime = new Date();
		this.timePassed = 0;
		this.progress = 0;
		this.timer = null;

		this.startTimer();
		return this;
	}

	stop()
	{
		this.stopTimer();
		return this;
	}

	/* this will get the element that is being used.
	@param (mixed) element = the element selector or object
	@return (object) the element */
	getElement(element)
	{
		return (typeof element === 'string')? document.querySelector(element) : element;
	}

	/* this will get the delta to be used with the animation.
	@return (number) the current delta */
	delta(t)
	{
		let delta = 0;

		switch(this.ease)
		{
			case 'easeInOut':
			case 'easeInOutQuad':
				delta = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
				break;
			case 'easeIn':
			case 'easeInQuad':
				delta = (t * t);
				break;
			case 'easeInCubic':
				delta = (t * t * t);
				break;
			case 'easeInQuart':
				delta = (t * t * t * t);
				break;
			case 'easeInCirc':
				delta = (1 - Math.sin(Math.acos(t)));
				break;
			case 'easeOut':
			case 'easeOutQuad':
				delta = (t * (2 - t));
				break;
			case 'easeOutCubic':
				delta = ((--t) * t * t + 1);
				break;
			case 'easeOutQuart':
				delta = (1 - (--t) * t * t * t);
				break;
			case 'linear':
				delta = t;
				break;
			default:
				delta = t;
		}
		return delta;
	}

	/* this will perform the animation on the element by
	incrementally updating the element object property
	by the timed progress. */
	animate()
	{
		this.timePassed = new Date() - this.startTime;

		let percent = this.timePassed / this.duration,
		progress = this.progress = (percent > 1)? 1 : percent;

		let delta = this.delta(progress);
		this.animation.step(delta);

		/* if the progress is 1 the animation is complete */
		if(progress >= 1)
		{
			this.stopTimer();
			this.updateStatus('completed');
		}
		else
		{
			this.timer = window.requestAnimationFrame(this.animationCallBack);
		}
	}

	updateStatus(status)
	{
		let action = () =>
		{
			switch(status)
			{
				case 'started':
					break;
				case 'stopped':
					break;
				case 'completed':
				case 'error':
					this.checkCallBack();
					break;
			}
		};

		/* we want to save the status and call the
		action function */
		this.status = status;
		action();
	}

	checkCallBack()
	{
		let callBack = this.callBack;
		if(typeof callBack === 'function')
		{
			callBack(this.status);
		}
	}

	/* this will start the animation by setting up the
	animation timer. */
	startTimer()
	{
		/* this will check to stop any previous timer before
		creating a new timer */
		this.stopTimer();

		/* we want to call the animation first to not show a
		delay in the animation before the callback is called */
		this.updateStatus('started');
		this.animate();
		return this;
	}

	/* this will stop the animation timer if still setup */
	stopTimer()
	{
		var w = window;
		if(this.timer)
		{
			w.cancelAnimationFrame(this.timer);
			this.updateStatus('stopped');
		}

		if(this.delayTimer)
		{
			w.clearTimeout(this.delayTimer);
		}
		return this;
	}
}