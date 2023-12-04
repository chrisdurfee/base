import { AttrMovement } from './attr-movement.js';
import { CssMovement } from './css-movement.js';
import { Movement } from './movement.js';

/**
 * MovementFactory
 *
 * This will create a movement.
 *
 * @class
 */
export class MovementFactory
{
	/**
	 * This will setup the movement type.
	 *
	 * @param {object} element
	 * @param {object} settings
	 * @return {Movement|null}
	 */
	static setupMovementType(element, settings)
	{
		let movement = null;
		const type = this.getType(element, settings);
		switch (type)
		{
			case 'css':
				movement = new CssMovement(element, settings);
				break;
			case 'attr':
				movement = new AttrMovement(element, settings);
				break;
		}
		return movement;
	}

	/**
	 * This will get the movement type.
	 *
	 * @param {object} element
	 * @param {object} settings
	 * @return {string}
	 */
	static getType(element, settings)
	{
		return (element.style && settings.property in element.style)? 'css' : 'attr';
	}

	/**
	 * This will create a movement.
	 *
	 * @param {object} element
	 * @param {object} settings
	 * @return {Movement}
	 */
	static create(element, settings)
	{
		return this.setupMovementType(element, settings);
	}
}