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
        this.selected = false; 
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

        return {
            tag: 'a', 
            className: this.className || null, 
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
        return typeof string !== 'object'? string : null;
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
        data = base.router.data; 

        var watchers = [
            {
                value: ['[[path]]', data],
                callBack: function(ele, value)
                {
                    var selected = (value === ele.pathname); 
                    self.update(ele, selected); 
                }
            }
        ]; 

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
        return watchers; 
    }, 

    /**
     * This will update the class on the element. 
     * 
     * @param {object} ele 
     * @param {bool} selected 
     */
    update: function(ele, selected)
    {
        if(this.selected === false && selected === true) 
        {
            this.selected = true;
            base.addClass(ele, this.selectedClass); 
        }
        else if(this.selected === true && selected === false)
        {
            this.selected = false;
            base.removeClass(ele, this.selectedClass);
        }
    }
});