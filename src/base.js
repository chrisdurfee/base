import { base } from './main/base.js';
import { Ajax } from './modules/ajax/ajax.js';
import { Atom } from './modules/atom/atom.js';
import { Component } from './modules/component/component.js';
import { Jot } from './modules/component/jot.js';
import { Unit } from './modules/component/unit.js';
import { dataBinder } from './modules/data-binder/data-binder.js';
import { Data, Model, SimpleData } from './modules/data/data.js';
import { Html } from './modules/html/html.js';
import { Builder } from './modules/layout/builder.js';
import { } from './modules/layout/directives/core/default-directives.js';
import { Directives } from './modules/layout/directives/directives.js';
import { NavLink, router } from './modules/router/router.js';
import { StateTracker as State } from './modules/state/state-tracker.js';

base.augment(
{
    Ajax,
    Html,
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
    Ajax, Atom, Builder, Component, Data, Directives, Html, Jot, Model, NavLink, SimpleData, State, Unit, base, dataBinder, router
};

