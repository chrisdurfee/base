import { base } from './main/base.js';
import { DataTracker } from './main/data-tracker/data-tracker.js';
import { EventMethods } from './main/events/event-methods.js';
import { Ajax } from './modules/ajax/ajax.js';
import { Atom } from './modules/atom/atom.js';
import { Component } from './modules/component/component.js';
import { Jot } from './modules/component/jot.js';
import { Pod } from './modules/component/pod.js';
import { Unit } from './modules/component/unit.js';
import { dataBinder } from './modules/data-binder/data-binder.js';
import { Data, Model, SimpleData } from './modules/data/data.js';
import { DateTime } from "./modules/date/date-time.js";
import { Html } from './modules/html/html.js';
import { Import } from './modules/import/import.js';
import { Builder } from './modules/layout/builder.js';
import './modules/layout/directives/core/default-directives.js';
import { Directives } from './modules/layout/directives/directives.js';
import { NavLink, router } from './modules/router/router.js';
import { StateTracker as State } from './modules/state/state-tracker.js';
import { Arrays } from './shared/arrays.js';
import { Dom } from './shared/dom.js';
import { Encode } from './shared/encode/encode.js';
import { Objects } from './shared/objects.js';
import { Strings } from './shared/strings.js';
import { Types } from './shared/types.js';

/**
 * This will set the base module classes to the base object. This is
 * used to make the modules available to the application. This is
 * to support legacy code.
 */
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

/**
 * This will export base and all the modules.
 */
export { Ajax, Arrays, Atom, base, Builder, Component, Data, dataBinder, DataTracker, DateTime, Directives, Dom, Encode, EventMethods as Events, Html, Import, Jot, Model, NavLink, Objects, Pod, router, SimpleData, State, Strings, Types, Unit };

