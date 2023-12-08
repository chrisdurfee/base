/**
 * Migration Notes for base 2 to base 3
 *
 * This will migrate to the next version of base. The goal is to make the migration as easy as possible. Due to some inconsistencies in teh previous versions, a lot of the code has been refractored to make it more consistent. This will break some of the previous code, but it will be easier to maintain in the future.
 *
 * Core Changes
 * The core base object used to allow access to all modules and functions. We have reduces the amount of modules addes to the base object. The following modules have been removed from the base object:
 *
 * The dom methods for data, css, attributes, width, height, offset, and position have been moved to the Dom module. Ue the Dom module to access these methods.
 *
 * The core object has been refactored into the shared modules
 *
 * Ajax
 * The ajax object has been changed to uppercase "Ajax" where it used to be lowsercase (ajax) to be more consistent with the other modules.
 *
 * HtmlBuilder
 * The HtmlBuilder has been refactored to the Html module. The methods have been converted to static methods.
 *
 * Layout
 * The layutBuilder is not called "Builder." The methods have been converted to static methods. The Builder class no longer extends the HtmlBuilder class. It now uses the HtmlHelper class that extends the Html module but overrides some methods to make it easier to build layouts.
 *
 * The LayerParser has been refactored to the Parser class. The methods have been converted to static methods.
 *
 * Directives
 * The directive have been removed from the LayoutBuilder and moved to the Directives module. The directives have been refactored to be more consistent.
 *
 * The onSet, onState, and watcher callbacks have updated the params to pass the "value" as the first param and the "ele" as the second param.
 */
{
    ['propName', (val, ele) =>
    {
        return Div({class: val}, 'test');
    }]
}
 /**
 * We have added a new directive called onDestroyed. This will be called when the element is removed from the DOM.
 *
 * The Data modules have been updated to use the new DataProxy class. The DataProxy allows you to skip using the oold getter and setter methods. You can now use the dot notation to get and set data and it will still publish the changes to the dataBinder.
 */
// Old data
data.get('name');
data.set('name', 'test');

// New data
data.name;
data.name = 'test';
/**
 * The watcher directive has been added to allow any attribute to be watched by wrapping a property in the [[ ]] brackets. This will create a watcher on the property and update the attribute when the property is updated. This can be added to any attribute including class, herf, src, and the text content.
 */
// new watcher
Div({class: '[[propName]]'})

// multi attribute watching
A({href: '/account/user/[[userId]]'}, '[[userName]] and [[age]]')

// custom data watching
Div({class: ['[[propName]]', data]})

// multi data watcher
Div({class: ['[[propName]] [[otherPropName]]', [data, otherData]]})

// with callback
const callBack = ([propName, otherProp]) =>
{
    const active = propName === true? 'active' : 'inactive';
    return `${active} ${otherProp}}`;
};

Div({class: ['[[propName]] [[otherPropName]]', [data, otherData], callBack]})
/**
 * State
 * The state object has been refactored to the StateTracker class. The methods have been converted to static methods.
 *
 * Date
 * The date object has been refactored to the DateTime object.
 *
 * Atom
 * The atom object no longer supports inheritance. The Atom class has been refactored to use a callback funnction. The callback function will return the props and children. You can pass optional args to reduce the amount of code needed to create atoms. The props go first, then children but you can omit the props if you only have children. The children should be wrapped in an array unless you just have a textContent string, then you can just pass the string value. Atoms should use composition instead of inheritance.
 */
const Div = Atom((props, children) =>
{
	return {tag: 'div', ...props, children};
});

let layout = Div({class: 'text'}) // props only
layout = Div('test') // text child only
layout = Div([]) // array child only

layout = Div({class: 'text'}, 'test') // props and text child
layout = Div({class: 'text'}, [
    Div('test'),
    Div('test')
]) // props and array child

/**
 * Components
 * The components now use the same args pattern as the atoms. The props go first, then children but you can omit the props if you only have children. The children should be wrapped in an array unless you just have a textContent string, then you can just pass the string value.
 *
 * The component class no longer support the builder methods. Use the Builder class to build the layout.
 *
 * The cacheable directive is now called cache to make it consistant with the atom directives.
 *
 * The "cache" method is now removed.
 *
 * The Builder is now the only way to render a component by using the "render" method. The render method will return the layout and the component instance.
 *
 * The setup method does not render a component.
 *
 * Import
 * We have added a new IMport module to allow loading modules dybamically. This will allow you to load modules on demand.
 */