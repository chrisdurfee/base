import { base } from './main/base.js';
import { Ajax } from './modules/ajax/ajax.js';
import { Atom } from './modules/atom/atom.js';
import { Component } from './modules/component/component.js';
import { Unit } from './modules/component/unit.js';
import { Jot } from './modules/component/jot.js';
import { dataBinder } from './modules/data-binder/data-binder.js';
import { Data, Model, SimpleData } from './modules/data/data.js';
import { Directives } from './modules/layout/directives/directives.js';
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
    Ajax, Atom, Directives, Builder, Component, Data, Jot, Model, NavLink, SimpleData, State, Unit, base, dataBinder, router
};

