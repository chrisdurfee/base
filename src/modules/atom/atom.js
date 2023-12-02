import { WatcherHelper } from "../layout/watcher-helper.js";

/**
 * This will prepare the children.
 *
 * @param {mixed} value
 * @returns {mixed}
 */
const prepareChildren = (value) =>
{
	if (typeof value !== 'string')
	{
		return value;
	}

	return setChildString(value);
};

/**
 * This will set the child string.
 *
 * @param {string} value
 * @returns {array}
 */
const setChildString = (value) =>
{
	return [{
		tag: 'text',
		textContent: value
	}];
};

/**
 * This will parse the arguments passed to the atom.
 *
 * @param {Array} args
 * @returns {Object}
 */
const parseArgs = (args) =>
{
	if (!args)
    {
    	return;
    }

    const first = args[0];
    if (typeof first === 'string')
    {
    	return {
        	props: {},
            children: setChildString(first)
        };
    }

	if (Array.isArray(first) && WatcherHelper.isWatching(first) === false)
	{
		return {
			props: {},
			children: first
		};
	}

    return {
    	props: first,
        children: prepareChildren(args[1])
    };
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