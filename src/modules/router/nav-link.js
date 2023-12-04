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
 */
export class NavLink extends Component
{
    /**
     * This will configure the link active class.
     *
     * @protected
     */
    beforeSetup()
    {
        this.selectedClass = this.activeClass || 'active';
    }

    /**
     * This will render the component.
     *
     * @return {object}
     */
    render()
    {
        const href = this.href,
        text = this.text,
        watchers = this.setupWatchers(href, text);

        return {
            tag: 'a',
            className: this.className || null,
            onState: ['selected', {
                [this.selectedClass]: true
            }],
            href: this.getString(href),
            text: this.getString(text),
            children: this.children,
            watch: watchers
        };
    }

    /**
     * This will get string.
     *
     * @param {string} string
     * @return {(string|null)}
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
     * @return {array}
     */
    setupWatchers(href, text)
    {
        const exact = (this.exact !== false),
        data = router.data;

        const watchers = [];

        if(href && typeof href === 'object')
        {
            watchers.push(
            {
                attr: 'href',
                value: href
            });
        }

        if(text && typeof text === 'object')
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
                this.update(ele, selected);
            }
        });

        return watchers;
    }

    setupStates()
    {
        return {
            selected: false
        };
    }

    /**
     * This will update the class on the element.
     *
     * @param {object} ele
     * @param {bool} selected
     */
    update(ele, selected)
    {
        this.state.set('selected', selected);
    }
}