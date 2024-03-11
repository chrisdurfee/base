import { Objects } from "../../shared/objects.js";

/**
 * This will get hte path of the prop.
 *
 * @param {string} path
 * @param {string} prop
 * @returns {string}
 */
function getNewPath(path, prop)
{
    const isNan = isNaN(Number(prop));
    const propPath = isNan ? prop : `[${prop}]`;
    if (path === '')
    {
        return propPath;
    }

    return isNan ?`${path}.${propPath}` : `${path}${propPath}`;
}

/**
 * This will create a handler for the proxy.
 *
 * @param {object} data
 * @param {string} path
 * @param {string} dataRoot
 * @returns {Proxy}
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
         * @returns {*}
         */
        // @ts-ignore
        get(target, prop, receiver)
        {
            let value = target[prop];
            // Directly return the property if it's on the root level and we're at the root path
            if (path === '' && prop in target)
            {
                if (typeof value === 'function')
                {
                    return value.bind(target);
                }

                return value;
            }

            // Access the property within the dataRoot
            const dataTarget = target[dataRoot] || target;
            value = Reflect.get(dataTarget, prop, receiver);

            // Return the value directly if it's not an object
            if (Objects.isPlainObject(value) || Array.isArray(value))
            {
                // Create a new handler for nested properties
                const newPath = getNewPath(path, prop);
                // @ts-ignore
                return new Proxy(value, createHandler(data, newPath, dataRoot));
            }

           return value;
        },

        /**
         * This will set the value of the prop.
         *
         * @param {object} target
         * @param {string} prop
         * @param {*} value
         * @param {object} receiver
         * @returns {*}
         */
        set(target, prop, value, receiver)
        {
            // Set the property at the root level if we're at the root path
            if (path === '' && prop in target)
            {
                target[prop] = value;
                return true;
            }

            const newPath = getNewPath(path, prop);
            data.set(newPath, value);

            return true;
        }
    };
}

/**
 * This will create a data proxy.
 *
 * @param {object} data
 * @returns {Proxy}
 */
// @ts-ignore
export const DataProxy = (data, root = 'stage') => new Proxy(data, createHandler(data, '', root));