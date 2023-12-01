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
            text: first
        };
    }

	if (Array.isArray(first))
	{
		return {
			props: {},
			children: first
		};
	}

    return {
    	props: first,
        children: args[1] || null
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