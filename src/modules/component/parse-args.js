import { ArrayProp, DefaultProps, ObjectProp, StringProp } from "./prop-utils.js";

/**
 * This will parse the arguments passed to the atom.
 *
 * @param {Array<any>} args
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
	const firstType = typeof first;
	if (firstType === 'string' || firstType === 'number')
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