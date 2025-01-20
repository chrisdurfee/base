/**
 * This will get the parent set data.
 *
 * @param {object} parent
 * @returns {object|null}
 */
export const getParentData = (parent) =>
{
	if (parent.data)
	{
		return parent.data;
	}

	if (parent.context && parent.context.data)
	{
		return parent.context.data;
	}

	if (parent.state)
	{
		return parent.state;
	}

	return null;
};