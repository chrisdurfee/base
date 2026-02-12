import { Directive } from './directive.js';

/**
 * Directives
 *
 * This will hold all directives.
 */
export const Directives =
{
    /**
     * @type {Array<any>} keys
     */
    keys: [],

    /**
     * @type {object} items
     */
    items: {},

    /**
     * This will add a directive.
     *
     * @param {string} name
     * @param {function} callBack
     * @returns {object}
     */
    add(name, callBack)
    {
        this.keys.push(name);
        this.items[name] = Directive(name, callBack);

        return this;
    },

    /**
     * This will get a directive.
     *
     * @param {string} name
     * @returns {object|null}
     */
    get(name)
    {
        return this.items[name] || null;
    },

    /**
     * This will get all directive names.
     *
     * @returns {Array<any>}
     */
    all()
    {
        return this.keys;
    }
};