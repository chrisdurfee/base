/**
 * This will deeply compare two values.
 *
 * Handles primitives, NaN, null, Date, RegExp, arrays,
 * plain objects, and circular references.
 *
 * @param {*} value1
 * @param {*} value2
 * @param {WeakSet} visited
 * @returns {boolean}
 */
const deepEqual = (value1, value2, visited) =>
{
	if (value1 === value2)
	{
		return true;
	}

	const type1 = typeof value1;
	if (type1 !== typeof value2)
	{
		return false;
	}

	/* NaN is the only value not equal to itself */
	if (type1 === 'number')
	{
		return (Number.isNaN(value1) && Number.isNaN(value2));
	}

	if (type1 !== 'object' || value1 === null || value2 === null)
	{
		return false;
	}

	if (value1 instanceof Date)
	{
		return (value2 instanceof Date && value1.getTime() === value2.getTime());
	}

	if (value1 instanceof RegExp)
	{
		return (value2 instanceof RegExp && value1.source === value2.source && value1.flags === value2.flags);
	}

	const isArray1 = Array.isArray(value1);
	if (isArray1 !== Array.isArray(value2))
	{
		return false;
	}

	/* guard against circular references */
	if (visited.has(value1))
	{
		return true;
	}
	visited.add(value1);

	if (isArray1)
	{
		const length = value1.length;
		if (length !== value2.length)
		{
			return false;
		}

		for (let i = 0; i < length; i++)
		{
			if (!deepEqual(value1[i], value2[i], visited))
			{
				return false;
			}
		}
		return true;
	}

	const keys1 = Object.keys(value1);
	if (keys1.length !== Object.keys(value2).length)
	{
		return false;
	}

	for (let i = 0, length = keys1.length; i < length; i++)
	{
		const key = keys1[i];
		if (!Object.prototype.hasOwnProperty.call(value2, key))
		{
			return false;
		}

		if (!deepEqual(value1[key], value2[key], visited))
		{
			return false;
		}
	}
	return true;
};

/**
 * This will compare if two values match.
 *
 * @param {*} option1
 * @param {*} option2
 * @returns {boolean}
 */
export const equals = (option1, option2) =>
{
	return deepEqual(option1, option2, new WeakSet());
};