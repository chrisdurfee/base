import {router} from './router.js';
import {Component} from '../component/component.js';

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
        let href = this.href,
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
        let type = typeof string;
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
        let exact = (this.exact !== false),
        data = router.data;

        let watchers = [];

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
            callBack: (ele, value) =>
            {
                let selected = exact? (value === ele.pathname) : (new RegExp(ele.pathname + '($|\/|\\.).*').test(value));
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