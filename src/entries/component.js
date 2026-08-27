/**
 * Component / UI toolkit subpath entry.
 *
 * Importing from '@base-framework/base/component' provides the rendering
 * toolkit (Component, Unit, Jot, Pod, Atom, Builder, Import) without the
 * Ajax, Model service, Router, DateTime and other unrelated modules.
 *
 * The core and reactive directive sets are registered as a side effect so
 * bind, watch, map, for, onSet and friends work the same way they do when
 * importing from the package root. The routing directives are not: they
 * belong to the 'router' subpath, which registers them.
 */
import { registerDirectives } from '../modules/layout/directives/directive-registry.js';
import { coreDirectives } from '../modules/layout/directives/core/core-directives.js';
import { reactiveDirectives } from '../modules/layout/directives/core/reactive-directives.js';

registerDirectives(coreDirectives, reactiveDirectives);

export { Atom } from '../modules/atom/atom.js';
export { Component } from '../modules/component/component.js';
export { Jot } from '../modules/component/jot.js';
export { Pod } from '../modules/component/pod.js';
export { Unit } from '../modules/component/unit.js';
export { Import } from '../modules/import/import.js';
export { Builder } from '../modules/layout/builder.js';
export { coreDirectives } from '../modules/layout/directives/core/core-directives.js';
export { reactiveDirectives } from '../modules/layout/directives/core/reactive-directives.js';
export { registerDirectives } from '../modules/layout/directives/directive-registry.js';
export { Directives } from '../modules/layout/directives/directives.js';
