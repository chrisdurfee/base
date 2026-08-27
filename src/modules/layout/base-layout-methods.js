import { base } from '../../main/base.js';
import { Builder } from './builder.js';

/**
 * This will add the layout methods to the base class.
 *
 * The package root calls this so `base.buildLayout()` keeps working. It is
 * not run from the builder itself: that would make the base singleton, and
 * everything it carries, reachable from every layout that renders.
 *
 * @returns {void}
 */
export const setupBaseLayoutMethods = () =>
{
	base.augment(
	{
		/**
		 * This will build a JSON layout.
		 *
		 * @param {object} obj
		 * @param {object} [container]
		 * @param {object} [parent]
		 * @returns {void}
		 */
		buildLayout(obj, container, parent)
		{
			Builder.build(obj, container, parent);
		}
	});
};
