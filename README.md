# Base Framework

## Framework Overview

Our goal with Base is to solve many client-side and Server-side rendering issues. Base focuses on reusability, scalability, and performance.

Base has a core that supports adding and removing events, custom events, data-tracking, element class and attribute modifying, object and type utils, etc.

The framework is modular and has additional modules to help with ajax, HTML, layouts, data, data-binding, states, dates, routing, components, atoms, etc.

You can learn more about how to use Base in the wiki documentation. [Base Wiki](https://github.com/chrisdurfee/base/wiki)


## Layouts

Base framework uses components to render an application. Base creates and renders components using native JavaScript. Layouts are scaffolded using JavaScript object literals. Because the layouts are rendered client-side using native JavaScript, the framework does not require a compiling or build process.

Learn more: [Base Layouts](https://github.com/chrisdurfee/base/wiki/Layout)


## Components and Atoms

Components are encapsulated layouts that contain the presentation and functionality. They are reusable and extensible, helping to reduce redundant code through abstract types.

learn more: [Base Components](https://github.com/chrisdurfee/base/wiki/Components)

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


## Atoms
Atoms are the building blocks for reusable layouts, allowing common design patterns and elements to be shared between multiple components and other atoms.

Learn more about Atoms: [Base Atoms](https://github.com/chrisdurfee/base/wiki/Atoms)

Base has a package that has already created most of the HTML Atoms needed for rendering layouts. This package can be installed via npm.

```bash
npm install @base-framework/atoms
```

Here is the repository for the atoms package: [Base Atoms](https://github.com/chrisdurfee/atoms). Like the Base Framework, the atoms package is open-source and free to use.

## Organisms

Base has a package that has some special organisms that can make building complex layouts quicker. This package can be installed via npm.

```bash
npm install @base-framework/organisms
```

Here is the repository for the organisms package: [Base Atoms](https://github.com/chrisdurfee/organisms). The organisms package is open-source and free to use.


## Element Directives

Elements created by Base have access to custom directives, enabling more functionalities than standard HTML elements. These include caching, adding states, binding and watching data, re-rendering contents, declarative routing and switching, array mapping and binding, event listeners, and more.

Learn more about Element Directives: [Base Element Directives](https://github.com/chrisdurfee/base/wiki/Directives)


## Data Binding, Watching, and Linking

Base supports "bindables" for creating and using data, supporting both shallow and deep nested data. Bindables can be one-way or two-way bindings.

Types of bindables include:
- **Data**: A generic object with complex, deep nested data.
- **SimpleData**: A shallow data object.
- **Models**: Child of Data, with default attributes and server resource connectivity.

```javascript
import { Atom } from '@base-framework/base';

// If the parent component has a Data object with a "count" property.

// Binding to "data" property of a component
const FormInput = Atom((props, children) => (
    Input({
        ...props,
        bind: 'count' // Bi-directional binding to the "count" property of the parent component's Data object.
    }),
    children
));

// Watching the "data" property of a component on the className attribute.
Div({class: '[[className]]'})

// Multi-attribute watching
A({href: '/account/user/[[userId]]'}, '[[userName]] - [[age]]')

// Multi-data watcher
Div({class: ['[[propName]] [[otherPropName]]', [data, otherData]]})
```

Learn more about Data Binding: [Base Data Binding](https://github.com/chrisdurfee/base/wiki/Directives#binding-to-data)


## Performance

Components are static by default, rendering only once per instance. They become dynamic when bound to bindable data sources, allowing for content re-rendering, value changes, function calls, and class additions on data change.


## Getting Started

To begin using the Base Framework in a client-side or server-side rendered project, follow these steps:

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

Basic Component Creation
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

To allow more reusability, you create static elements as Atoms and Organisms. Atoms and Organisms should use composition. These can be used in multiple components and layouts.

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

class Page extends Component
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


## Example Project Using Base Framework

[Base Platform Example](https://github.com/chrisdurfee/next-app-shell)

[Base App Example](https://github.com/chrisdurfee/base-update)

[Base Website Example](https://github.com/chrisdurfee/life)

[Base Game Example](https://github.com/chrisdurfee/multisplode)

## Contributing

Contributions to Base Framework are welcome. Follow these steps to contribute:

- Fork the repository.
- Create a new branch for your feature or bug fix.
- Commit your changes with clear, descriptive messages.
- Push your branch and submit a pull request.
- Before contributing, read our CONTRIBUTING.md for coding standards and community guidelines.

## License

Base Framework is licensed under the MIT License. See the LICENSE file for details.

## Contact

For questions, suggestions, or issues, contact us:

- Email:
- GitHub Issues: github.com/chrisdurfee/base/issues
- Community Chat: Discord coming soon
- Follow us on Social Media:
