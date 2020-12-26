import { Directive } from './directive.js';

export const Directives =
{
    keys: [],
    items: {},

    /**
     * This will add a directive.
     *
     * @param {string} name
     * @param {function} callBack
     * @return {object}
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
     * @return {object|null}
     */
    get(name)
    {
        return this.items[name] || null;
    },

    /**
     * This will get all directive names.
     *
     * @return {array}
     */
    all()
    {
        return this.keys;
    }
};