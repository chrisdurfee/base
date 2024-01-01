import { Objects } from "../../shared/objects.js";
import { Types } from "../../shared/types.js";

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

            // Return the value directly if it's not an object
            if (!Types.isObject(value) || Objects.isPlainObject(value) === false)
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

            data.set(newPath, value);
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
export const DataProxy = (data, root = 'stage') => new Proxy(data, createHandler(data, '', root));