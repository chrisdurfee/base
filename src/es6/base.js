import {base} from './core.js';
import {ajax} from './modules/ajax/ajax.js';
import {dataBinder} from './modules/data-binder/data-binder.js';
import {Data, SimpleData, Model} from './modules/data/data.js';
import {state} from './modules/state/state.js';
import {router, NavLink} from './modules/router/router.js';
import {builder} from './modules/layout/layout-builder.js';
import {Component} from './modules/component/component.js';
import {Atom} from './modules/atom/atom.js';

base.augment(
{
    ajax,
    dataBinder,
    Data,
    SimpleData,
    Model,
    state,
    builder,
    router,
    Component
});

export {
    base,
    ajax,
    dataBinder,
    Data,
    SimpleData,
    Model,
    state,
    builder,
    router,
    Component,
    NavLink,
    Atom
}

