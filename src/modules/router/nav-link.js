import { Component } from '../component/component.js';
import { router } from './router.js';

/**
 * NavLink
 *
 * This will create a nav link that will add an active
 * class when the browser route path matches the link
 * href.
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
        this.selectedClass = this.activeClass || 'active';
    }

    /**
     * This will render the component.
     *
     * @returns {object}
     */
    render()
    {
        const href = this.href,
        text = this.text,
        watchers = this.setupWatchers(href, text);

        return {
            tag: 'a',
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
        const exact = (this.exact !== false),
        data = router.data;

        const watchers = [];

        if (href && typeof href === 'object')
        {
            watchers.push(
            {
                attr: 'href',
                value: href
            });
        }

        if (text && typeof text === 'object')
        {
            watchers.push(
            {
                attr: 'text',
                value: text
            });
        }

        watchers.push({
            value: ['[[path]]', data],
            callBack: (value, ele) =>
            {
                const path = ele.pathname + ele.hash;
				const selected = exact? (value === path) : (new RegExp('^' + ele.pathname + '($|#|/|\\.).*').test(value));
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