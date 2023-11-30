import { base } from './main/base.js';
import { Ajax } from './modules/ajax/ajax.js';
import { Atom } from './modules/atom/atom.js';
import { Component, Jot, Unit } from './modules/component/component.js';
import { dataBinder } from './modules/data-binder/data-binder.js';
import { Data, Model, SimpleData } from './modules/data/data.js';
import { Builder } from './modules/layout/builder.js';
import { NavLink, router } from './modules/router/router.js';
import { StateTracker as State } from './modules/state/state-tracker.js';

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
    Ajax, Atom, Builder, Component, Data, Jot, Model, NavLink, SimpleData, State, Unit, base, dataBinder, router
};

