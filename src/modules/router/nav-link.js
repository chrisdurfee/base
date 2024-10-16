import { Component } from '../component/component.js';
import { router } from './router.js';

/**
 * Watcher
 *
 * This will create a watcher object.
 *
 * @param {string} attr
 * @param {string} value
 * @returns {object}
 */
const Watcher = (attr, value) => ({
    attr,
    value
});

/**
 * This will check if the path is active.
 *
 * @param {string} path
 * @param {string} url
 * @returns {boolean}
 */
const iSActive = (path, url) => new RegExp('^' + path + '($|#|/|\\.).*').test(url);

/**
 * NavLink
 *
 * This will create a nav link that will add an active
 * class when the browser route path matches the link
 * href.
 *
 * @property {string} activeClass - The active class to add.
 * @property {string} class - The class
 * @property {string} exact - The exact match
 * @property {string|object} href - The href or watcher object
 * @property {string|object} text - The text or watcher object
 * @property {array|string} nest - The nested elements
 *
 * @class
 * @extends Component
 */
export class NavLink extends Component
{
    /**
     * This will configure the link active class.
     *
     * @protected
     * @returns {void}
     */
    beforeSetup()
    {
        // @ts-ignore
        this.selectedClass = this.activeClass || 'active';
    }

    /**
     * This will render the component.
     *
     * @returns {object}
     */
    render()
    {
        // @ts-ignore
        const href = this.href,
        // @ts-ignore
        text = this.text,
        watchers = this.setupWatchers(href, text);

        return {
            tag: 'a',
            cache: 'link',
            // @ts-ignore
            class: this.class || this.className || null,
            onState: ['selected', {
                [this.selectedClass]: true
            }],
            href: this.getString(href),
            text: this.getString(text),
            nest: this.nest || this.children,
            watch: watchers
        };
    }

    /**
     * This will get the link path.
     *
     * @returns {string|null}
     */
    getLinkPath()
    {
        // @ts-ignore
        return this?.link?.pathname || null;
    }

    /**
     * This will get string.
     *
     * @param {string} string
     * @returns {(string|null)}
     */
    getString(string)
    {
        const type = typeof string;
        return (type !== 'object' && type !== 'undefined')? string : null;
    }

    /**
     * This will setup the watchers.
     *
     * @protected
     * @param {string} href
     * @param {string} text
     * @returns {array}
     */
    setupWatchers(href, text)
    {
        // @ts-ignore
        const exact = (this.exact !== false),
        data = router.data;

        const watchers = [];

        if (href && typeof href === 'object')
        {
            watchers.push(Watcher('href', href));
        }

        if (text && typeof text === 'object')
        {
            watchers.push(Watcher('text', text));
        }

        watchers.push({
            value: ['[[path]]', data],
            callBack: (value, ele) =>
            {
                const path = ele.pathname + ele.hash;
				const selected = exact? (value === path) : (iSActive(ele.pathname, value));
                this.update(selected);
            }
        });

        return watchers;
    }

    /**
     * This will setup the states.
     *
     * @protected
     * @returns {object}
     */
    setupStates()
    {
        return {
            selected: false
        };
    }

    /**
     * This will update the class on the element.
     *
     * @param {boolean} selected
     * @returns {void}
     */
    update(selected)
    {
        this.state.selected = selected;
    }
}