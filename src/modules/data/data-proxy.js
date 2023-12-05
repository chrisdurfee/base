/**
 * This will get hte path of the prop.
 *
 * @param {string} path
 * @param {string} prop
 * @returns {string}
 */
function getNewPath(path, prop)
{
	if (path === '')
    {
        path = prop;
        return (!isNaN(path))? `[${prop}]` : path;
    }

	if (!isNaN(prop))
    {
        return `${path}[${prop}]`
    }

    return `${path}.${prop}`;
}

/**
 * This will create a handler for the proxy.
 *
 * @param {string} path
 * @returns {Proxy}
 */
function createHandler(path = '')
{
    return {

        /**
         * This will get the value of the prop.
         *
         * @param {object} target
         * @param {string} prop
         * @param {object} receiver
         * @returns {mixed}
         */
        get(target, prop, receiver)
        {
            /**
             * We want to get the path of the prop to publish updates.
             */
            const newPath = getNewPath(path, prop);

            const value = Reflect.get(target, prop, receiver);
            if (value && typeof value === 'object')
            {
                return new Proxy(value, createHandler(newPath));
            }
            return value;
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
            /**
             * We want to get the path of the prop to publish updates.
             */
            const newPath = getNewPath(path, prop);

            if (typeof value === 'object')
            {
                return new Proxy(target[prop], createHandler(newPath));
            }

            return Reflect.set(target, prop, value, receiver);
        }
    };
}

/**
 * This will create a data proxy.
 *
 * @param {object} data
 * @returns {Proxy}
 */
export const DataProxy = (data) => new Proxy(data, createHandler());