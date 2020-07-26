/* base framework module */
(function()
{
	"use strict";

	/**
	 * Mouse
	 *
	 * This will create a mouse event object.
	 * @class
	 */
	var Mouse = base.Class.extend(
	{
		/**
		 * @contrustor
		 * @param {string} [mode]
		 * @param {function} [callBackFn]
		 * @param {object} [obj]
		 * @param {boolean} [capture]
		 */
		constructor: function(mode, callBackFn, obj, capture)
		{
			/* this will store the mouse position */
			this.position = { x: null, y: null };
			this.callBackFn = callBackFn;
			this.obj = obj || window;
			this.capture = capture || false;

			/* the mouse can be tracked by different modes
			and this will control the tracking position mode */
			this.mode = mode || 'page';
		},

		/**
		 * This will update the mode.
		 *
		 * @param {string} mode
		 */
		updateMode: function(mode)
		{
			switch(mode)
			{
				case 'client':
					this.mode = mode;
					break;
				case 'screen':
					this.mode = mode;
					break;
				default:
					this.mode = 'page';
			}
		},

		/**
		 * This will update the position.
		 *
		 * @param {object} e
		 * @return {object}
		 */
		updatePosition: function(e)
		{
			var position = this.position;

			if(e)
			{
				/* we need to check if the mode is set to
				client or return page position */
				switch(this.mode)
				{
					case 'client':
						position.x = e.clientX || e.pageX;
						position.y = e.clientY || e.pageY;
						break;
					case 'screen':
						position.x = e.clientX || e.pageX;
						position.y = e.clientY || e.pageY;
						break;
					default:
						position.x = e.pageX;
						position.y = e.pageY;
				}
			}

			return position;
		},

		/**
		 * This will start tracking.
		 */
		start: function()
		{
			var parent = this;
			var callBackFn = this.callBackFn;
			/* we want to update mouse position and
			standardize the return */
			var mouseResults = function(e)
			{
				// cross-browser result
				e = e || window.event;

				var position = this.position = parent.updatePosition(e);

				/* we can now send the mouse wheel results to
				the call back function */
				if(typeof callBackFn === 'function')
				{
					callBackFn.call(position, e);
				}
			};

			base.events.add('mousemove', this.obj, mouseResults, this.capture, true, callBackFn);
		},

		/**
		 * This will stop tracking.
		 */
		stop: function()
		{
			base.off('mousemove', this.obj, this.callBackFn, this.capture);
		}
	});

	base.extend.Mouse = Mouse;
})();