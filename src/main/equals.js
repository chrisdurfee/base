import { Objects } from '../shared/objects.js';

/**
 * This will count the properties of an object.
 *
 * @param {object} obj
 * @returns {number}
 */
const countProperty = (obj) =>
{
	let count = 0;
	for (let [property, value] of Object.entries(obj))
	{
		count++;

		/**
		 * We want to do a recursive count to get
		 * any child properties.
		 */
		if (typeof obj[property] === 'object')
		{
			count += countProperty(obj[property]);
		}
	}
	return count;
};

/**
 * This will validate if the object properties match another object.
 *
 * @param {object} obj1
 * @param {object} obj2
 * @returns {boolean}
 */
const matchProperties = (obj1, obj2) =>
{
	let matched = false;

	if (typeof obj1 !== 'object' || typeof obj2 !== 'object')
	{
		return matched;
	}

	/**
	 * We want to check each object1 property to the
	 * object 2 property.
	 */
	for (let [property, value1] of Object.entries(obj1))
	{
		/**
		 * We want to check if the property is owned by the
		 * object and that they have matching types.
		 */
		if (!Objects.hasOwnProp(obj2, property))
		{
			break;
		}

		const value2 = obj2[property];
		if (typeof value1 !== typeof value2)
		{
			break;
		}

		/* we want to check if the type is an object */
		if (typeof value1 === 'object')
		{
			/**
			 * This will do a recursive check to the
			 * child properties.
			 */
			matched = matchProperties(value1, value2);
			if (matched !== true)
			{
				/* if a property did not match we can stop
				the comparison */
				break;
			}
		}
		else
		{
			if (value1 === value2)
			{
				matched = true;
			}
			else
			{
				break;
			}
		}
	}

	return matched;
};

/**
 * This will compare if two objects match.
 *
 * @param {object} obj1
 * @param {object} obj2
 * @returns {boolean}
 */
const compareObjects = (obj1, obj2) =>
{
	/* we want to check if they have the same number of
	properties */
	const option1Count = countProperty(obj1),
	option2Count = countProperty(obj2);
	if (option1Count !== option2Count)
	{
		return false;
	}

	return matchProperties(obj1, obj2);
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
	/* we want to check if there types match */
	const option1Type = typeof option1,
	option2Type = typeof option2;
	if (option1Type !== option2Type)
	{
		return false;
	}

	/* we need to check if the options are objects
	because we will want to match all the
	properties */
	if (option1Type === 'object')
	{
		return compareObjects(option1, option2);
	}

	return (option1 === option2);
};