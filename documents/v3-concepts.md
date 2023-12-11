# Technical Research Notes on HTML Element Handling

## Overview
This document explores various methods for creating and manipulating HTML elements, focusing on JavaScript-based approaches. Each method demonstrates different syntax and approaches to achieve similar outcomes.

### Source HTML
```html
<div class="test">Text</div>
```

## Methodologies

### 1. Current Approach
Using a JavaScript object to represent an HTML element with class and text properties.
```javascript
{class: 'test', text: 'text'}
```

### 2. Inline Alternative
An array-based representation combining class and text.
```javascript
[{class: 'test'}, 'text']
```

### 3. Atom Alternative
A function call simulating the creation of a `div` element.
```javascript
Div({class: 'test'}, 'text')
```

### 4. Builder Alternative
A chainable method approach for creating elements.
```javascript
Div().css('test').in('text')
```

## Use Case Examples
Demonstrations of how these methodologies can be applied in various scenarios.

### Nesting Elements

#### Source HTML for Nesting
```html
<div class="test">
    <Header type="text" value="Text">
        <div class="name">update</div>
    </Header>
</div>
```

#### Approaches

1. **Inline Nesting**: Supports both strings and arrays.
   ```javascript
   [{class:'test'}, [
       Header({class: 'test'}, [
           [{class: 'name'}, 'update']
       ])
   ]];
   ```

2. **Alternate Inline Nesting**
   ```javascript
   [DIV, {class:'test'}, [
       [HEADER, {type:'text'}, 'Text']
   ]];
   ```

3. **Atom Nesting**: Also supports strings and arrays.
   ```javascript
   Div({class: 'test'}, [
       Header({class: 'test'}, [
           H1({class: 'name'}, 'title')
       ])
   ]);
   ```

4. **Builder Approach for Nesting**
   ```javascript
   Div().css('test').add([
       Header().css('test').add([
           Div().css('name').add('update')
       ])
   ]);
   ```

5. **HTML Nesting via Properties**
   ```javascript
   Div({class: 'test'}, {
       html: '<span>test</span>'
   })
   ```

6. **Atom Optional Arguments**
   ```javascript
   Div({class: 'text'}) // props only
   Div('test') // text child only
   Div([Header()]) // array child only
   ```

### Binding Techniques

#### Old Binding
```javascript
Div({watch: ['[[propName]]', 'class']})
// More complex example with data and callback
Div({
    watch: [
        { value: ['[[propName]]', data] },
        // ...
    ]
})
```

#### New Binding and Data Binding
```javascript
Div({class: '[[propName]]'})
A({href: '/account/user/[[userId]]'}, '[[userName]] and [[age]]')
Div({class: ['[[propName]]', data]})
// ...
```

### Callbacks and Tagged Templates
```javascript
// With callback
const callBack = ({propName, otherProp}) => { /* Implementation */ };

// Tagged templates
Div({class: Watch`${['propName', data]} and ${['otherProp', otherData]}`})
```

## Data Handling with Proxies

### Proxies for Simple and Nested Data
```javascript
let data = new Data({ name: 'test', class: 'active' });
data.name;
data.name = 'test';

// Deep data
data = new Data({
    name: 'test',
    class: 'active',
    other: { name: 'test', class: 'active' }
});
data.other.name;
data.other.name = 'test';
```
