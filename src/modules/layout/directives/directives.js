import { Directive } from './directive.js';
import { addContext, context, useContext } from './directives/core/context/context-directives.js';
import { addState, cache, useData, useParent, useState } from './directives/core/parent/parent-directives.js';
import { forEach } from './directives/core/reactive/for-each.js';
import { map } from './directives/core/reactive/map.js';
import { onCreated } from './directives/core/reactive/on-created.js';
import { onDestroyed } from './directives/core/reactive/on-destroyed.js';
import { onSet } from './directives/core/reactive/on-set.js';
import { onState } from './directives/core/reactive/on-state.js';
import { watch } from './directives/core/reactive/watch.js';
import { addRoute } from './directives/core/route.js';
import { addSwitch } from './directives/core/switch.js';

/**
 * Directives
 *
 * This will hold all directives.
 */
export const Directives =
{
    /**
     * @member {array} keys
     */
    keys: [],

    /**
     * @member {object} items
     */
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

Directives
	.add('cache', cache)
	.add('onCreated', onCreated)
	.add('onDestroyed', onDestroyed)
	.add('bind', bind)
	.add('onSet', onSet)
	.add('onState', onState)
	.add('watch', watch)
	.add('useParent', useParent)
	.add('useData', useData)
	.add('useState', useState)
	.add('addState', addState)
	.add('map', map)
	.add('for', forEach)
	.add('html', addHtml)
	.add('useContext', useContext)
	.add('addContext', addContext)
	.add('context', context)
	.add('role', addRole)
	.add('aria', addAria)
	.add('route', addRoute)
	.add('switch', addSwitch);