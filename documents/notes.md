# Technical Research Notes on Framework Enhancements

## Overview
This document outlines the base goals and proposed changes for the next version of our software framework, focusing on improvements in atom elements, layout management, data binding, and request handling.

### Base Goals for Version 2.6.0

#### Version 2.6.0 Atoms
Introducing a nested structure for creating sections and articles.
```javascript
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
```

### Proposed Changes for Next Version

#### Next Version Atoms
Refining the atom structure to be more concise and clear.
```javascript
Section([
    Article({ class: 'post' }, [
        Header([
            H1('Title')
        ])
    ])
])
```

#### Atoms Enhancements
- **Composition Over Inheritance**: Update atoms to use composition instead of inheritance.
- **Two-Parameter Structure**: Atoms to use two parameters - the first for properties and the second for children.
- **Optional Parameters**: Allowing atoms to have optional parameters.
```javascript
Div({class: 'test'}, 'text')
```

### Atom Nesting
Supporting both strings and arrays for nested atom structures.
```javascript
Div({class: 'test'}, [
    Header({class: 'test'}, [
        H1({class: 'name'}, 'title')
    ])
]);
```

### HTML Nesting
Enabling HTML nesting within atom structures.
```javascript
Div({class: 'test', html: '<span>test</span>'})
```

### Atom Functionality
Implementation of atom functionality with support for various use cases.
```javascript
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
```

### Layout Management
Proposed updates to the layout builder, including support for string children and array properties.
```javascript
// swapped ele and value
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
```

### Data Binding and Watching
Enhancements in data binding and watching mechanisms.
```javascript
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
```

### Component Updates
Replacing the cache method with a more efficient 'cacheable' approach.

### Data Handling
Transitioning to proxies for managing data objects.
```javascript
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
```

### Requests
Replacing traditional AJAX requests with the Fetch API, while maintaining support for request aborting.
```javascript
// Fetch API implementation details
// ...
```
