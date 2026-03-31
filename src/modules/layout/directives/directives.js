/**
 * Directives
 *
 * This will hold all directives. Uses a Map for O(1)
 * lookups on the hot path (parser calls get() for
 * every key of every layout object).
 */
export const Directives =
{
    /**
     * @type {Map<string, function>} items
     */
    items: new Map(),

    /**
     * This will add a directive.
     *
     * @param {string} name
     * @param {function} callBack
     * @returns {object}
     */
    add(name, callBack)
    {
        this.items.set(name, callBack);
        return this;
    },

    /**
     * This will get a directive.
     *
     * @param {string} name
     * @returns {function|null}
     */
    get(name)
    {
        return this.items.get(name) ?? null;
    }
};