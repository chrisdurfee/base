import { ArrayProp, DefaultProps, ObjectProp, StringProp } from "./prop-utils.js";

/**
 * This will parse the arguments passed to the atom.
 *
 * @param {array} args
 * @returns {object}
 */
export const parseArgs = (args) =>
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
	 * This will handle the child array.
	 */
	if (Array.isArray(first))
	{
		return ArrayProp(first);
	}

	/**
	 * This will handle default props and children.
	 */
    return ObjectProp(args);
};