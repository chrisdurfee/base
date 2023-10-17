// source
<div class="test">Text</div>

// current
{class: 'test', text: 'text'}

// inline alternative
[{class: 'test'}, 'text']

// atom alternative
Div({class: 'test'}, 'text')

// builder alternative
Div().css('test').in('text')

/**
 * Use case examples.
 */


/**
 * Nesting
 */
// source
<div class="test">
    <Header type="text" value="Text">
        <div class="name">update</div>
    </Header>
</div>

// inline nesting (supports both strings and arrays)
[{class:'test'}, [
    Header({class: 'test'}, [
        [{class: 'name'}, 'update']
    ])
]];

// or
[DIV, {class:'test'}, [
    [HEADER, {type:'text'}, 'Text']
]];

// atom nesting (supports both strings and arrays)
Div({class: 'test'}, [
    Header({class: 'test'}, [
        H1({class: 'name'}, 'title')
    ])
]);

// builder alternative
Div().css('test').add([
    Header().css('test').add([
        Div().css('name').add('update')
    ])
]);

// html nesting
Div({class: 'test'}, {
    html: '<span>test</span>'
})

// atom optionl args
Div({class: 'text'}) // props only
Div('test') // text child only
Div([Header()]) // array child only

const Div = (props, children) =>
{
    return {type: 'div', ...props, children};
};

const Div = (...args) =>
{
    const [props, children] = parseArgs(args);
    return {type: 'div', ...props, children};
};

const Div = ([props, children] = parseArgs(...args)) =>
{
    return {type: 'div', ...props, children};
};


// binding

// old binding
Div({watch: ['[[propName]]', 'class']})
Div({
    watch: [
        {
            value: ['[[propName]]', data],
        },
        {
            attr: 'href',
            value: ['/users/[[propName]]/[[name]]', [data, name]],
            callBack(params) {
                return params.value;
            }
        },
    ]
})

// new binding
Div({class: '[[propName]]'})

// multi attribute binding
A({href: '/account/user/[[userId]]'}, '[[userName]] and [[age]]')

// custom data binding
Div({class: ['[[propName]]', data]})

// multi data binding
Div({class: ['[[propName]] [[otherPropName]]', data, otherData]})

// with callback
const callBack = ({propName, otherProp}) =>
{
    const active = propName === true? 'active' : 'inactive';
    return `${active} ${otherProp}}`;
};

Div({class: [callBack, data, otherData]})

Div({class: `${data.active === true? 'active' : 'inactive'} [[otherPropName]]`})

const Watch = (...args) => {
    // do random

    return '';
};

// tagged tameplates
Div({class: Watch`${['propName', data]} and ${['otherProp', otherData]}`})

// Use proxies for data
let data = new Data({
    name: 'test',
    class: 'active'
});

// Old data
data.get('name');
data.set('name', 'test');

// New data
data.name;
data.name = 'test';

// proxies with arrays

// deep data
data = new Data({
    name: 'test',
    class: 'active',
    other: {
        name: 'test',
        class: 'active'
    }
});

data.other.name;
data.other.name = 'test';