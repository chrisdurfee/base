/**
 * This will get hte path of the prop.
 *
 * @param {string} path
 * @param {string} prop
 * @return {string}
 */
function getNewPath(path, prop)
{
    const propPath = isNaN(Number(prop)) ? prop : `[${prop}]`;
    return path === '' ? propPath : `${path}.${propPath}`;
}

/**
 * This will create a handler for the proxy.
 *
 * @param {object} data
 * @param {string} path
 * @param {string} root
 * @return {object}
 */
function createHandler(data, path = '', dataRoot = '')
{
    return {

        /**
         * This will get the value of the prop.
         *
         * @param {object} target
         * @param {string} prop
         * @param {object} receiver
         * @return {mixed}
         */
        get(target, prop, receiver)
        {
            // Directly return the property if it's on the root level and we're at the root path
            if (path === '' && prop in target)
            {
                return target[prop];
            }

            // Access the property within the dataRoot
            const dataTarget = target[dataRoot] || target;
            const value = dataTarget[prop];
			console.log('get', value)

            // Check if the property is a function and bind it
            if (typeof value === 'function')
            {
                return value.bind(dataTarget);
            }

            // Return the value directly if it's not an object
            if (!value || typeof value !== 'object' || Object.prototype.toString.call(value) !== '[object Object]')
            {
                return value;
            }

            // Create a new handler for nested properties
            const newPath = getNewPath(path, prop);
            return new Proxy(value, createHandler(data, newPath, dataRoot));
        },

        /**
         * This will set the value of the prop.
         *
         * @param {object} target
         * @param {string} prop
         * @param {mixed} value
         * @param {object} receiver
         * @return {mixed}
         */
        set(target, prop, value, receiver)
        {
            // Set the property at the root level if we're at the root path
            if (path === '' && prop in target)
            {
                target[prop] = value;
                return true;
            }

            // Set the property within the dataRoot
            const dataTarget = target[dataRoot] || target;
            const newPath = getNewPath(path, prop);

            console.log('set', newPath, value);
            dataTarget[prop] = value;
            return true;
        }
    };
}

/**
 * This will create a data proxy.
 *
 * @param {object} data
 * @return {Proxy}
 */
const DataProxy = (data, root = 'stage') => new Proxy(data, createHandler(data, '', root));


const data = {
    name: 'test',
    class: 'active',
	stage: {
		state: true,
	},
    other: { name: 'test', class: 'active' },
	values: [
		{ name: 'test', class: 'active' }
	],
	on(name)
	{
		console.log(name);
	},
	get(key)
	{
		this.stage[key];
	}
};

const clone = DataProxy(data);

// get
const name = clone.other.name;
console.log(name)

// get stage
const state = clone.state;
console.log(state)

// set
clone.other.name = 'test';
console.log(clone.other.name)

// set array
clone.values[0].name = 'test';
console.log(clone.values[0].name)

// set stage
clone.testProp = 'test';
console.log(clone.testProp)

// methods
clone.on('Test')
clone.get('state')