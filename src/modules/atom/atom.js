import { ArrayProp, DefaultProps, ObjectProp, StringProp } from "../component/prop-utils.js";
import { WatcherHelper } from "../layout/watcher-helper.js";

/**
 * This will create a watcher prop.
 *
 * @param {array} watch
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
 * @param {array} args
 * @returns {object}
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
    if (typeof first === 'string')
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

	/**
	 * This will handle default props and children.
	 */
    return ObjectProp(args);
};

/**
 * This will create an atom.
 *
 * @param {function} callBack
 * @returns {function}
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
		 * Thi swill allow the atom to access optional args.
		 */
		const {props, children} = parseArgs(args);
        return callBack(props, children);
    };
};