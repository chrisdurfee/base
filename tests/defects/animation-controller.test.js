import { describe, expect, it } from 'vitest';
import { AnimationController } from '../../src/modules/animations/animation-controller.js';
import { Animation } from '../../src/modules/animations/animation.js';

/**
 * This will create the settings for a simple opacity animation.
 *
 * @param {object} element
 * @returns {object}
 */
const createSettings = (element) => ({
	element,
	duration: 100,
	delay: 0,
	ease: 'linear',
	property: 'opacity',
	startValue: 0,
	endValue: 1
});

/**
 * This will create a controller with its delay timer already cancelled so
 * the frame loop can be driven manually from the test.
 *
 * @param {object} element
 * @returns {AnimationController}
 */
const createIdleController = (element) =>
{
	const controller = new AnimationController(createSettings(element), () => {});

	/* Cancel the queued setupAnimation/start so nothing runs after the
	 * test finishes, and neutralise the next-frame callback. */
	controller.stop();
	controller.animationCallBack = () => {};

	return controller;
};

describe('AnimationController frame stepping', () =>
{
	it('builds one movement per animated property', () =>
	{
		const element = document.createElement('div');
		const animation = new Animation(element, createSettings(element));

		expect(animation.movements.length).toBe(1);
		expect(typeof animation.movements[0].step).toBe('function');
	});

	it('maps animation progress onto an easing delta', () =>
	{
		const element = document.createElement('div');
		const controller = createIdleController(element);

		expect(controller.delta(0)).toBe(0);
		expect(controller.delta(1)).toBe(1);
	});

	/**
	 * DEFECT: `AnimationController.animate()`
	 * (src/modules/animations/animation-controller.js:174) calls
	 * `this.animation.step(delta)`, but the `Animation` class
	 * (src/modules/animations/animation.js) defines no `step` method — only
	 * the individual `Movement` instances it holds do
	 * (src/modules/animations/movement.js:129). Every frame therefore
	 * throws a TypeError, so animations never run.
	 */
	it('Animation exposes step() so the controller can drive a frame', () =>
	{
		expect(typeof Animation.prototype.step).toBe('function');
	});

	/**
	 * DEFECT: same root cause — src/modules/animations/animation-controller.js:174.
	 */
	it('animate() steps the animation without throwing', () =>
	{
		const element = document.createElement('div');
		const controller = createIdleController(element);

		controller.animation = new Animation(element, createSettings(element));
		controller.startTime = new Date();
		controller.progress = 0;

		expect(() => controller.animate()).not.toThrow();
	});
});
