import { ArrayProp, DefaultProps, ObjectProp, StringProp } from "../component/prop-utils.js";
import { WatcherHelper } from "../layout/watcher-helper.js";

/**
 * This will create a watcher prop.
 *
 * @param {Array<any>} watch
 * @returns {object}
 */
const WatcherProp = (watch) => ({
	props: {
		watch
	},
	children: []
});

/**
 * This will parse the arguments passed to the atom.
 *
 * @param {Array<any>} args - The arguments passed to the atom (props, children, or both)
 * @returns {{props: object, children: *}} An object containing separated props and children
 */
const parseArgs = (args) =>
{
	if (!args)
	{
		return DefaultProps();
	}

	/**
	 * This will handle string children and allow them
	 * to have watcher props.
	 */
	const first = args[0];
	const firstType = typeof first;
	if (firstType === 'string' || firstType === 'number')
	{
		return StringProp(first);
	}

	/**
	 * This will check if we have a child array or
	 * a watcher array.
	 */
	if (Array.isArray(first))
	{
		/**
		 * This will handle the child array.
		 */
		if (WatcherHelper.isWatching(first) === false)
		{
			return ArrayProp(first);
		}

		/**
		 * This will handle the watcher array.
		 */
		return WatcherProp(first);
	}

	// @ts-ignore
	const children = args[1] ?? args[0] ?? [];
	if (children && Array.isArray(children))
	{
		/**
		 * This will check if the first child is a watcher array
		 * and set it as a watcher prop.
		 */
		if (WatcherHelper.isWatching(children) === true)
		{
			args[0] = (!Array.isArray(args[0]))? args[0] : {};
			// @ts-ignore
			args[0].watch = children;
			args[1] = [];
		}
	}

	/**
	 * This will handle default props and children.
	 */
	return ObjectProp(args);
};

/**
 * This will create an atom.
 *
 * An Atom is a reusable layout function that accepts flexible arguments (props, children, or both)
 * and returns a layout object. The callback receives two separate parameters: props and children.
 *
 * @param {function(object, *): object} callBack - Callback function that receives (props, children) as separate parameters and returns a layout object
 * @returns {function(...*): object} A function that accepts flexible arguments and returns a layout object
 *
 * @example
 * // CORRECT: Two separate parameters
 * const Button = Atom((props, children) => ({
 *   tag: 'button',
 *   type: 'button',
 *   ...props,
 *   children
 * }));
 *
 * // CORRECT: Destructure inside the function body
 * const Card = Atom((props, children) => {
 *   const { width = 'w-64', image, badge } = props;
 *   return { tag: 'div', class: width, children };
 * });
 *
 * // INCORRECT: Don't destructure parameters (invalid JavaScript syntax)
 * // const Bad = Atom({width, image} => ({ ... })); // ❌ Syntax Error
 */
export const Atom = (callBack) =>
{
	/**
	 * This will create a closure that will
	 * parse the arguments and then call the
	 * callback.
	 */
	return (...args) =>
	{
		/**
		 * This will allow the atom to access optional args.
		 */
		const {props, children} = parseArgs(args);
		return callBack(props, children);
	};
};