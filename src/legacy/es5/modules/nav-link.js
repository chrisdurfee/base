/**
 * NavLink
 *
 * This will create a nav link that will add an active
 * class when the browser route path matches the link
 * href.
 *
 * @class
 */
var NavLink = base.Component.extend(
{
    /**
     * This will configure the link active class.
     *
     * @protected
     */
    beforeSetup: function()
    {
        this.selectedClass = this.activeClass || 'active';
    },

    /**
     * This will render the component.
     *
     * @return {object}
     */
    render: function()
    {
        var href = this.href,
        text = this.text;

        var watchers = this.setupWatchers(href, text);

        var onState = {};
        onState[this.selectedClass] = true;

        return {
            tag: 'a',
            className: this.className || null,
            onState: ['selected', onState],
            href: this.getString(href),
            text: this.getString(text),
            children: this.children,
            watch: watchers
        };
    },

    /**
     * This will get string.
     *
     * @param {string} string
     * @return {(string|null)}
     */
    getString: function(string)
    {
        var type = typeof string;
	    return (type !== 'object' && type !== 'undefined')? string : null;
    },

    /**
     * This will setup the watchers.
     *
     * @protected
     * @param {string} href
     * @param {string} text
     * @return {array}
     */
    setupWatchers: function(href, text)
    {
        var self = this,
        exact = (this.exact !== false),
        data = base.router.data;

        var watchers = [];

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
            callBack: function(ele, value)
            {
                var selected = exact? (value === ele.pathname) : (new RegExp('^' + ele.pathname + '($|\/|\\.).*').test(value));
                self.update(ele, selected);
            }
        });

        return watchers;
    },

    setupStates: function()
    {
        return {
            selected: false
        };
    },

    /**
     * This will update the class on the element.
     *
     * @param {object} ele
     * @param {bool} selected
     */
    update: function(ele, selected)
    {
        this.state.set('selected', selected);
    }
});