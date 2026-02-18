/**
 * Get the binding attribute for an element.
 *
 * @param {object|null} element
 * @returns {string}
 */
export const getBindAttr = (element) =>
{
	/**
	 * If no custom attr has been requested we will get the
	 * default attr of the element.
	 */
	let attr = 'textContent';
	if (!element || typeof element !== 'object')
	{
		return attr;
	}

	/**
	 * This will get the default attr by the element type.
	 */
	const tagName = element.tagName.toLowerCase();
	if (tagName === "input" || tagName === "textarea" || tagName === "select")
	{
		const type = element.type;
		if (!type)
		{
			attr = 'value';
			return attr;
		}

		switch (type)
		{
			case 'checkbox':
				attr = 'checked';
				break;
			case 'file':
				attr = 'files';
				break;
			default:
				attr = 'value';
		}
	}
	return attr;
};