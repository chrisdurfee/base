# Base Framework

## Framework Overview

Our goal with Base is to solve many client-side and Server-side rendering issues. Base focuses on reusability, scalability, and performance.

Base has a core that supports adding and removing events, custom events, data-tracking, element class and attribute modifying, object and type utils, etc.

The framework is modular and has additional modules to help with ajax, HTML, layouts, data, data-binding, states, dates, routing, components, atoms, etc.

You can learn more about how to use Base in the wiki documentation. [Base Wiki](https://github.com/chrisdurfee/base/wiki)

## Base Converter

There is a GPT created with ChatGPT that can convert code from other frameworks to Base. The GPT is new so it still has some issues but it is a good start. [Base Converter](https://chatgpt.com/g/g-uNL6KKeCo-base-converter/)


## Layouts

Base uses components to render an application. Base creates and renders components using native JavaScript. Layouts are scaffolded using JavaScript object literals. Because the layouts are rendered client-side or server-side using native JavaScript, the framework does not require a compiling or build process.

Layouts are reuable and can be used in multiple components and pages. Layouts can be nested and composed to create complex layouts.

```javascript

// Layouts use normal JavaScript object literals to create the layout.
{ class: 'name' } === <div class="name"></div>

// Input example
{ tag: 'input', type: 'text', value: 'name' } === <input type="text" value="name" />

// Nested layout example
{ class: 'name', nest: [ { class: 'child' } ] } === <div class="name"><div class="child"></div></div>

```

Base use atoms and components to create reusable layouts.

Learn more: [Base Layouts](https://github.com/chrisdurfee/base/wiki/Layout)


## Components and Atoms

Components are encapsulated layouts that contain the presentation and functionality. They are reusable and extensible, helping to reduce redundant code through abstract types.

```javascript
import { Component } from '@base-framework/base';

/**
 * Page
 *
 * This will create a page component.
 *
 * @class Page
 * @extends {Component}
 */
export class Page extends Component
{
    render()
    {
        return {
            class: 'page'
        };
    }
}
```

Components have lifecycle methods for actions during creation, setup, and destruction.

learn more: [Base Components](https://github.com/chrisdurfee/base/wiki/Components)

## Atoms
Atoms are the building blocks for reusable layouts, allowing common design patterns and elements to be shared between multiple components and other atoms.

## Atom Types
Atoms can be instantiated using various methodologies:

### Function Atoms
These atoms are instantiated with either standard functions or arrow functions, equipped with a props object to transfer properties to the atoms.

```typescript
const Div = (props, children) => ({
    ...props,
    children
});
```

### Atom Callbacks
Atoms may be created using the Atom function, which accepts a callback function as its sole parameter. The callback function is passed a props object and children array and returns an object containing the atom's layout.

```typescript
import { Atom } from '@base-framework/base';

const Button = Atom((props, children) => ({
    tag: 'button',
    ...props,
    children
}));
```

#### Atom Nesting
Atoms should use composition to nest other atoms. This is achieved by passing the children array to the atoms args.

```typescript
import { Atom } from '@base-framework/base';

const SecondaryButton = Atom((props, children) => (Button({
    ...props,
    class: 'secondary-btn',
    children
}));
```

## Adding Event Listeners
Event listener callbacks within atoms accept two parameters: the originating event object and the "parent" component object in which the atom resides.

## Utilization of Atoms
To leverage an atom, invoke its function and pass the requisite values via a props and children.

```javascript
const Div = (props, children) => ({
    ...props,
    children
});

Div({ class: 'text' }, 'text');
```

Atoms created with the Base Atom callback function support passing optional params including props or children to the atom. The props object should always be first but if the atom does not require props, the children array or string can be passed as the first argument.

```javascript
import { Atom } from '@base-framework/base';

const Div = Atom((props, children) => ({
    ...props,
    tag: 'div',
    children
}));

// props only
Div({class: 'text'});

// text child only
Div('test');

// array child only
Div([
    Div('test')
]);

// props and text child
Div({class: 'text'}, 'test');

// props and array children
Div({class: 'text'}, [
    Div('test'),
    Div('test')
]);
```

Learn more: [Base Atoms](https://github.com/chrisdurfee/base/wiki/Atoms)

Base has a package that has already created most of the HTML Atoms needed for rendering layouts. This package can be installed via npm.

```bash
npm install @base-framework/atoms
```

Here is the repository for the atoms package: [Base Atoms](https://github.com/chrisdurfee/atoms). Like Base, the atoms package is open-source and free to use.

## Organisms

Base has a package that has some special organisms that can make building complex layouts quicker. This package can be installed via npm.

```bash
npm install @base-framework/organisms
```

Here is the repository for the organisms package: [Base Organisms](https://github.com/chrisdurfee/organisms). The organisms package is open-source and free to use.


## Element Directives

Elements created by Base have access to custom directives, enabling more functionalities than standard HTML elements. These include caching, adding states, binding and watching data, re-rendering contents, declarative routing and switching, array mapping and binding, event listeners, and more.

Learn more: [Base Element Directives](https://github.com/chrisdurfee/base/wiki/Directives)


## Data Binding, Watching, and Linking

Base supports "bindables" for creating and using data, supporting both shallow and deep nested data. Bindables can be one-way or two-way bindings.

Types of bindables include:
- **Data**: A generic object with complex, deep nested data.
- **SimpleData**: A shallow data object.
- **Models**: Child of Data, with default attributes and server resource connectivity.

```javascript
import { Atom } from '@base-framework/base';

/**
 * If a parent component has a Data object with a "count" property.
 *
 * This will create an input with the value bound of the "count"
 * property. This bind is Bi-directional binding to the
 * "count" property of the parent component's Data object.
 */
Input({ bind: 'count' })

/**
 * Elements can watch for changes in data and re-render when the data changes.
 */
Div({class: '[[className]]'})

// Multi-attribute watching
A({href: '/account/user/[[userId]]'}, '[[userName]] - [[age]]')

// Multi-data watcher
Div({class: ['[[propName]] [[otherPropName]]', [data, otherData]]})
```

Base Data objects are bindable. There are a few types of data objects:

```javascript
import { Data, SimpleData, Model } from '@base-framework/base';

/**
 * Data object
 *
 * This can store deep nested data including arrays and objects.
 */
const data = new Data({
    name: {
        first: 'Bruce',
        last: 'Wayne'
    },
    address: {
        street: '123 Gotham St',
        city: 'Gotham',
        state: 'NY'
    },
    phones: ['555-555-5555', '555-555-5556'],
    age: 21
});

/**
 * SimpleData object
 *
 * This can store shallow data.
 */
const simpleData = new SimpleData({ name: 'batman' });

/**
 * The data objects are proxies and can be used like objects.
 */

// Retrieval
let prop = data.name.first;
// or
let name = data.get('name.first');

// Assignment
simpleData.name = 'batman';
// or
data.set('name', 'batman');

// Pushing to an array
data.push('phones', '555-555-5557');

// changing an item in an array
data.set('phones[0]', '555-555-5558');

// Batch updates using an object
data.set({
    name: 'batman',
    age: 21
});

// Deletion
data.delete('name');

/**
 * Model object
 *
 * This can store default attributes and server resource
 * connectivity.
 *
 * The model's service already has methods for adding,
 * updating, deleting, and fetching data from the
 * server.
 */
const UserModel = Model.extend({
    defaults: {
        name: {
            first: 'Bruce',
            last: 'Wayne'
        },
        address: {
            street: '123 Gotham St',
            city: 'Gotham',
            state: 'NY'
        },
        age: 21
    },
    url: '/api/user',

    xhr: {

        /**
         * Custom methods can be added to the model service.
         *
         * @param {object} instanceParams
         * @param {function} callback
         * @returns {object|bool} The xhr object
         */
        customMethod(instanceParams, callback)
        {
            if (!this.isValid())
            {
                return false;
            }

            let params = 'op=customParam' +
                '&' + this.setupObjectData();

            // this will be added to the base url of the model
            const URL = "/custom/url";
            return this._post(URL, params, instanceParams, callBack);
        }
    }
});

const model = new UserModel();

/**
 * The model can be used to fetch data from the server.
 *
 * The response will be set to the model.
 */
model.xhr.get({}, (response) => {

});

// post
model.xhr.add({}, (response) => {

});

// put
model.xhr.update({}, (response) => {

});

// delete
model.xhr.delete({}, (response) => {

});

```
The component also supports the state property. This is another bindable type extended from the SimpleData object so it only supports shallow data.

```javascript

/**
 * This will return the state propreties and values that will be
 * use to create the "state" object.
 *
 * @returns {object}
 */
setupStates()
{
    return {
        count: 0,
        loading: false
    };
}

```

Each component can have one "data" property that can be set using the "setData" method.

If a component has been created using the "route" or "switch" directive, it will receive a "route" property that will contain the route data which is also bindable.

The data objects push changes to the elements that are bound to the data. This allows for re-rendering of the elements when the data changes.

Here is an example of how to use data binding in a component:

```javascript
import { Div } from '@base-framework/atoms';
import { Component } from '@base-framework/base';

/**
 * Timer
 *
 * This will create a timer component that uses state watching.
 *
 * @class
 */
export class Timer extends Component
{
    /**
     * This will render the timer.
     *
     * @returns {object}
     */
    render()
    {
        // This will rerender the div text content when the count state changes.
        return Div('[[count]]');
    }

    /**
     * This will setup the states.
     *
     * @returns {object}
     */
    setupStates()
    {
        return { count: 0 };
    }

    afterSetup()
    {
        const ONE_SECOND = 1000;
        window.setInterval(() => this.state.increment('count'), ONE_SECOND);
    }
}
```

Learn more: [Base Data Binding](https://github.com/chrisdurfee/base/wiki/Directives#binding-to-data)


## Performance

Components are static by default, rendering only once per instance. They become dynamic when bound to bindable data sources, allowing for content re-rendering, value changes, function calls, and class additions on data change.


## Getting Started

To begin using Base framework in a client-side or server-side rendered project, follow these steps:

1. **Clone the repository**:
```bash
git clone https://github.com/yourrepository/base-framework.git
```

2. Navigate to the project directory:
```bash
cd base-framework
```
3. Install dependencies (ensure Node.js is installed):
```bash
npm install @base-framework/base
```

4. Import the framework into your project:
```javascript
import { base } from '@base-framework/base';
```

## Usage

Create a new component:

```javascript
import { base, Component } from '@base-framework/base';

/**
 * Page
 *
 * This will create a page component.
 *
 * @class Page
 * @extends {Component}
 */
export class Page extends Component
{
    render()
    {
        /**
         *  This will render an empty div and assign a className
         *  of "value".
         */
        return {
            class: this.key
        };
    }
}
```

Use the builder to create a new instance of the component:

```javascript
import { Builder } from '@base-framework/base';
import { Page } from './components/page.js';

/**
 * This will create a new instance of the Page component.
 */
const page = new Page(
{
    /**
     * Props can be passed to the component and accessed by their key names.
     *
     * You can name the props anything you want, but it is recommended to
     * use camel case and avoid using reserved keywords.
     */
    key: 'value'
});

// The props passed can now be accessed by the component class.
```

Render the component to the DOM:

```javascript
import { Builder } from '@base-framework/base';
import { Page } from './components/page.js';

/**
 * This will create a new instance of the Page component.
 */
const page = new Page();

// Render the component to the DOM.
const container = document.body;
Builder.render(page, container);
```

To allow more reusability, you create static elements as atoms and organisms. Atoms and organisms should use composition. These can be used in multiple components and layouts.

```javascript
import { Atom } from '@base-framework/base';

const Button = Atom((props, children) => ({
    tag: 'button',
    ...props,
    children
}));

const SecondaryButton = Atom((props, children) => (Button({
    ...props,
    class: 'secondary-btn',
    children
}));

```

Atoms can be added to components and other atoms:

```javascript

import { Component } from '@base-framework/base';
import { Div } from '@base-framework/atoms';
import { SecondaryButton } from './atoms/button.js';

export class Page extends Component
{
    render()
    {
        return Div([
            SecondaryButton({
                /**
                 * This will add a click event listener to the button.
                 *
                 * @param {Event} event The event object
                 * @param {Component} parent The parent component object
                 * @returns {void}
                 */
                click(event, parent) =>
                {
                    // Code to access the parent component
                }
            })
        ]);
    }
}
```

## Code Splitting

Base supports code splitting, allowing you to load components and modules on demand. This can help reduce the initial load time of your application. You can import atoms or components on demand using the Import module.

```javascript
import { Import } from "@base-framework/base";
import { A, Div, H1, Header } from "@base-framework/atoms";

// Without using Vite

/**
 * This will create an import buttons.
 *
 * @returns {object}
 */
const ImportButtons = () => (
    Div([
        Header([
            H1('Aside')
        ]),
        Div({ class: 'card' }, [

            // Importing the buttons module on demand
            Import('../../../../../../components/atoms/import-buttons.js')
        ])
    ])
);

// With Vite

/**
 * This will create an import buttons.
 *
 * @returns {object}
 */
const ImportButtons = () => (
    Div([
        Header([
            H1('Aside')
        ]),
        Div({ class: 'card' }, [

            /**
             * This will import the buttons module on demand. The import function
             * needs to be used to add the module to the vite build.
             */
            Import({ src: () => import('../../../../../../components/atoms/import-buttons.js') })
        ])
    ])
);
```

## Example Todo App

Here is an example of a todo app using Base:

```javascript
import { Button, Div, Form, H1, Input, Li, Ul } from "@base-framework/atoms";
import { Builder, Data } from "@base-framework/base";

/**
 * This will create a to-do app.
 *
 * @returns {object}
 */
export function ToDoApp()
{
    /**
     * This will set up the data store for the to-do app.
     */
    const data = new Data({ items: [] });

    /**
     * This will handle the form submission for adding a new to-do item.
     *
     * @param {object} event
     */
    const handleSubmit = (event) =>
    {
        event.preventDefault();
        const form = event.target;
        const input = form.querySelector('input');

        // add the new to-do item to the array of items
        data.push('items', input.value);
        input.value = '';
    };

    /**
     * This will handle removing a to-do item from the list.
     *
     * @param {number} index
     * @returns {boolean}
     */
    const handleRemove = (index) => data.splice('items', index);

    return Div([
        H1('To-Do App'),
        Form({ submit: handleSubmit }, [
            Input({ placeholder: 'Add a new item' }),
            Button({ type: 'submit' }, 'Add')
        ]),
        Ul({
            for: [data, 'items', (item, index) => Li([
                Span(item),
                Button({ click: () => handleRemove(index) }, 'Remove')
            ])]
        })
    ]);
}

/**
 * This will render the to-do app to the body of the document.
 */
Builder.render(ToDoApp(), document.body);
```


## Example Projects Using Base

[Base Platform Example](https://github.com/chrisdurfee/next-app-shell)

[Base App Example](https://github.com/chrisdurfee/base-update)

[Base Website Example](https://github.com/chrisdurfee/life)

[Base Server Example](https://github.com/chrisdurfee/base-server)

[Base Game Example](https://github.com/chrisdurfee/multisplode)


## Contributing

Contributions to Base are welcome. Follow these steps to contribute:

- Fork the repository.
- Create a new branch for your feature or bug fix.
- Commit your changes with clear, descriptive messages.
- Push your branch and submit a pull request.
- Before contributing, read our CONTRIBUTING.md for coding standards and community guidelines.

## License

Base is licensed under the MIT License. See the LICENSE file for details.

## Contact

For questions, suggestions, or issues, contact us:

- Email:
- GitHub Issues: github.com/chrisdurfee/base/issues
- Community Chat: Discord coming soon
- Follow us on Social Media:
