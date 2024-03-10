import { Dom } from '../../shared/dom.js';

/**
 * This will remove a class and hide an element.
 *
 * @param {object} obj
 * @param {string} animationClass
 * @param {function} callBack
 */
const removeClassAndHide = (obj, animationClass, callBack) =>
{
	obj.style.display = 'none';
	removeAnimationClass(obj, animationClass, callBack);
};

/**
 * This will remove a class when the animation is finished.
 *
 * @param {object} obj
 * @param {string} animationClass
 * @param {function} callBack
 */
const removeAnimationClass = (obj, animationClass, callBack) =>
{
	if(typeof callBack === 'function')
	{
		callBack.call();
	}

	Dom.removeClass(obj, animationClass);
	animate.animating.remove(obj, animationClass);
};

const getElement = (element) =>
{
	return (typeof element === 'string')? document.getElementById(element) : element;
};

/* this will add and remove css animations */
export const animate =
{
	/* this class tracks all objects being animated and can
	add and remove them when completed */
	animating:
	{
		/**
		 * @param array objects
		 */
		objects: [],

		/**
		 * This will add an animation.
		 *
		 * @param {object} object
		 * @param {string} className
		 * @param {number} timer
		 */
		add(object, className, timer)
		{
			if (!object)
			{
				return;
			}

			this.stopPreviousAnimations(object);
			this.objects.push({
				object,
				className,
				timer
			});
		},

		/**
		 * This will remove an animation from an element.
		 *
		 * @param {object} object
		 * @param {string} removeClass
		 */
		remove(object, removeClass)
		{
			if (!object)
			{
				return;
			}

			const animations = this.checkAnimating(object);
			if (animations === false)
			{
				return;
			}

			let animation, indexNumber,
			objects = this.objects;
			for (var i = 0, maxLength = animations.length; i < maxLength; i++)
			{
				animation = animations[i];
				/* we want to stop the timer */
				this.stopTimer(animation);

				if (removeClass)
				{
					/* we want to remove the className */
					Dom.removeClass(animation.object, animation.className);
				}

				/* we want to remove the animation fron the object array */
				//var indexNumber = this.objects.indexOf(animation);
				indexNumber = objects.indexOf(animation);
				if (indexNumber > -1)
				{
					objects.splice(indexNumber, 1);
				}
			}
		},

		/**
		 * This will stop an animation timer.
		 * @param {object} animation
		 */
		stopTimer(animation)
		{
			if (animation)
			{
				const timer = animation.timer;
				window.clearTimeout(timer);
			}
		},

		/**
		 * This will check if the element is animating.
		 * @param {object} obj
		 * @return {(array|boolean)}
		 */
		checkAnimating(obj)
		{
			let animation,
			animationArray = [];

			/* we want to get any timers set for our object */
			const objects = this.objects;
			for (var i = 0, maxLength = objects.length; i < maxLength; i++)
			{
				animation = objects[i];
				if (animation.object === obj)
				{
					animationArray.push(animation);
				}
			}

			return (animationArray.length > 0)? animationArray : false;
		},

		/**
		 * This will stop previous animations still animating.
		 * @param {object} obj
		 */
		stopPreviousAnimations(obj)
		{
			this.remove(obj, 1);
		},

		/**
		 * This will reset the objects.
		 */
		reset()
		{
			this.objects = [];
		}
	},

	/**
	 * This will create an animation.
	 *
	 * @param {object} obj
	 * @param {string} animationClass
	 * @param {number} duration
	 * @param {function} callBack
	 * @param {funtion} endCallBack
	 */
	create(obj, animationClass, duration, callBack, endCallBack)
	{
		const animationCallBack = () => callBack(obj, animationClass, endCallBack);

		const timer = window.setTimeout(animationCallBack, duration);
		this.animating.add(obj, animationClass, timer);
	},

	/**
	 * This will add an animation then hide the element.
	 *
	 * @param {object} object
	 * @param {string} animationClass
	 * @param {number} duration
	 * @param {function} endCallBack
	 */
	hide(object, animationClass, duration, endCallBack)
	{
		const obj = getElement(object);
		Dom.addClass(obj, animationClass);

		this.create(obj, animationClass, duration, removeClassAndHide, endCallBack);
	},

	/**
	 * This will add an animation then show the element.
	 *
	 * @param {object} object
	 * @param {string} animationClass
	 * @param {number} duration
	 * @param {function} endCallBack
	 */
	show(object, animationClass, duration, endCallBack)
	{
		const obj = getElement(object);
		Dom.addClass(obj, animationClass);
		obj.style.display = 'block';

		this.create(obj, animationClass, duration, removeAnimationClass, endCallBack);
	},

	/**
	 * This will add an animation to the element.
	 *
	 * @param {object} object
	 * @param {string} animationClass
	 * @param {number} duration
	 * @param {function} endCallBack
	 */
	set(object, animationClass, duration, endCallBack)
	{
		const obj = getElement(object);
		Dom.addClass(obj, animationClass);

		this.create(obj, animationClass, duration, removeAnimationClass, endCallBack);
	}
};