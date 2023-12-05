/**
 * Base Goals for the next version.
 */

/**
 * Version 2.6.0 atoms
 */
Section({
    nest: [
        Article({
            class: 'post',
            nest: [
                Header({
                    nest: [
                        H1({
                            text: 'Title'
                        })
                    ]
                })
            ]
        })
    ]
})

/**
 * Next version atoms
 */
Section([
    Article({ class: 'post' }, [
        Header([
            H1('Title')
        ])
    ])
])

/**
 * Atoms
 *
 * -- Update atoms to use composition instead of inheritance.
 *
 * -- Update atoms to use two params instead of one. The first
 * is the props and the second is the children.
 *
 * -- Update the atoms to allow optional params.
 */
Div({class: 'test'}, 'text')

// atom nesting (supports both strings and arrays)
Div({class: 'test'}, [
    Header({class: 'test'}, [
        H1({class: 'name'}, 'title')
    ])
]);

// html nesting
Div({class: 'test', html: '<span>test</span>'})

// atom optional args
Div({class: 'text'}) // props only
Div('test') // text child only
Div([Header()]) // array child only

const parseArgs = (args) =>
{
	if (!args)
    {
    	return;
    }

    const first = args[0];
    if (typeof first === 'string' || Array.isArray(first))
    {
    	return {
        	props: {},
            children: first
        };
    }

    return {
    	props: first,
        children: args[1] || []
    };
};

const Atom = (callBack) =>
{
	return (...args) =>
    {
    	const {props, children} = parseArgs(args);
        return callBack(props, children);
    };
};

const Div = Atom((props, children) =>
{
	return {tag: 'div', ...props, children};
});

const Input = Atom((props, children) =>
{
	return {tag: 'input', ...props, children};
});

const Checkbox = Atom((props, children) =>
{
	return Input({ type: 'checkbox', ...props}, children);
});

let layout = Div({class: 'text'}) // props only
console.log(layout)
layout = Div('test') // text child only
console.log(layout)
layout = Div([]) // array child only
console.log(layout)

layout = Checkbox();
console.log(layout)

/**
 * Layout
 *
 * -- Update the layout builder to support string children.
 *
 * -- Update the layout parse and builder to allow arrays on
 * properties other than children.
 *
 * -- Update the attr to check if the value has a "[[" or is an array
 * and to create a watcher on that attr.
 *
 * -- Update the layout builder to support adding directives.
 *
 * -- Export the default directives.
 *
 * -- Swap the ele and value in all onSet, onState, onUpdate methods.
 * it should return the value first then the ele.
 *
 * -- Update the watcher callback to swap the ele and value.
 *
 * Update the watcher callback to add the result to the
 * element like onSet and onState.
 */
// swapped elel and value
{
    onSet: ['propName', (val, ele) =>
    {
        return Div({class: val}, 'test');
    }]
}

// return watcher callback value
{
    watch: [{
        value: ['[[propName]]'],
        callBack(val, ele)
        {
            return Div({class: val}, 'test');
        }
    }]
}

/**
 * Data Binding and Watching
 *
 * -- Update the atom properties to use the bracket and array
 * data watching on any attribute.
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
const callBack = ({propName, otherProp}) =>
{
    const active = propName === true? 'active' : 'inactive';
    return `${active} ${otherProp}}`;
};

Div({class: ['[[propName]] [[otherPropName]]', [data, otherData], callBack]})

/**
 * Component
 *
 * -- Replace the cache mathod with the cacheable method.
 */

/**
 * Data
 *
 * Update the data objects to use proxies instead of getters and setters.
 */
const data = new Data({
    name: 'test',
    class: 'active',
    other: {
        name: 'test',
        class: 'active'
    }
});

data.other.name;
data.other.name = 'test';

const data = {
    name: 'test',
    class: 'active',
    other: {
        name: 'test',
        class: 'active'
    },
    items: [
        {
            name: 'name',
        }
    ]
};

const handler2 =
{
    get(target, prop, receiver)
    {
        console.log(prop)
        const value = target[prop];
        if (typeof value === 'undefined')
        {
            return null;
        }

        if (typeof value === 'object')
        {
            return new Proxy(target[prop], handler2);
        }

        return target[prop] ?? null;
    },

    set(obj, prop, newval)
    {
        console.log(prop)

        const value = obj[prop];
        if (typeof value === 'undefined')
        {
            return obj[prop] = newval;
        }

        if (typeof value === 'object')
        {
            return new Proxy(obj[prop], handler2);
        }

        return obj[prop] = newval;
    },
};

const proxy2 = new Proxy(data, handler2);

proxy2.other.name;
proxy2.other.name = 'test';

proxy2.items[0].name;
proxy2.items[0].name = 'test';

DataBinder.publish(data, 'path', value);

console.log(proxy2);

/**
 * Requests
 *
 * Replace ajax requests that use xhr with fetch. This should still support
 * aborting a request.
 */