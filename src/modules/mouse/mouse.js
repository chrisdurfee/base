import { Events } from "../../main/events/events.js";

/**
 * Mouse
 *
 * This will create a mouse event object.
 * @class
 */
export class Mouse
{
	/**
	 * @contrustor
	 * @param {string} [mode]
	 * @param {function} [callBackFn]
	 * @param {object} [obj]
	 * @param {boolean} [capture]
	 */
	constructor(mode, callBackFn, obj, capture)
	{
		/* this will store the mouse position */
		this.position = { x: null, y: null };
		this.callBackFn = callBackFn;
		this.obj = obj || window;
		this.capture = capture || false;

		/* the mouse can be tracked by different modes
		and this will control the tracking position mode */
		this.mode = mode || 'page';
	}

	/**
	 * This will update the mode.
	 *
	 * @param {string} mode
	 */
	updateMode(mode)
	{
		let selectedMode = 'page';

		switch (mode)
		{
			case 'client':
			case 'screen':
				selectedMode = mode;
				break;
		}

		this.mode = selectedMode;
	}

	/**
	 * This will update the position.
	 *
	 * @param {object} e
	 * @returns {object}
	 */
	updatePosition(e)
	{
		let x, y;

		if (e)
		{
			/* we need to check if the mode is set to
			client or return page position */
			switch (this.mode)
			{
				case 'client':
				case 'screen':
					x = e.clientX || e.pageX;
					y = e.clientY || e.pageY;
					break;
				default:
					x = e.pageX;
					y = e.pageY;
			}
		}

		return {
			y,
			x
		};
	}

	/**
	 * This will start tracking.
	 */
	start()
	{
		const callBackFn = this.callBackFn;
		/* we want to update mouse position and
		standardize the return */
		const mouseResults = (e) =>
		{
			const position = this.position = this.updatePosition(e);

			/* we can now send the mouse wheel results to
			the call back function */
			if (typeof callBackFn === 'function')
			{
				callBackFn.call(position, e);
			}
		};

		Events.add('mousemove', this.obj, mouseResults, this.capture, true, callBackFn);
	}

	/**
	 * This will stop tracking.
	 */
	stop()
	{
		Events.off('mousemove', this.obj, this.callBackFn, this.capture);
	}
}