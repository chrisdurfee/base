/**
 * Component / UI toolkit subpath entry.
 *
 * Importing from '@base-framework/base/component' provides the rendering
 * toolkit (Component, Unit, Jot, Pod, Atom, Builder, Import) without the
 * Ajax, Model service, DateTime and other unrelated modules.
 *
 * The default directives are registered here as a side effect so reactive
 * directives (bind, watch, map, for, onSet, etc.) work the same way they do
 * when importing from the package root.
 */
import '../modules/layout/directives/core/default-directives.js';

export { Atom } from '../modules/atom/atom.js';
export { Component } from '../modules/component/component.js';
export { Jot } from '../modules/component/jot.js';
export { Pod } from '../modules/component/pod.js';
export { Unit } from '../modules/component/unit.js';
export { Import } from '../modules/import/import.js';
export { Builder } from '../modules/layout/builder.js';
export { Directives } from '../modules/layout/directives/directives.js';
