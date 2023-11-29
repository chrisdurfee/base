import { base } from './main/base.js';
import { Ajax } from './modules/ajax/ajax.js';
import { dataBinder } from './modules/data-binder/data-binder.js';
import { Data, SimpleData, Model } from './modules/data/data.js';
import { StateTracker as State } from './modules/state/state-tracker.js';
import { router, NavLink } from './modules/router/router.js';
import { Builder } from './modules/layout/builder.js';
import { Unit, Component, Jot } from './modules/component/component.js';
import { Atom } from './modules/atom/atom.js';

base.augment(
{
    Ajax,
    dataBinder,
    Data,
    SimpleData,
    Model,
    State,
    Builder,
    router,
    Component
});

export {
    base,
    Ajax,
    dataBinder,
    Data,
    SimpleData,
    Model,
    State,
    Builder,
    router,
    Unit,
    Component,
    Jot,
    NavLink,
    Atom
};

