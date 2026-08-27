import { registerDirectives } from '../directive-registry.js';
import { coreDirectives } from './core-directives.js';
import { reactiveDirectives } from './reactive-directives.js';
import { routerDirectives } from './router-directives.js';

/**
 * This will register every built-in directive.
 *
 * It is a call rather than an import-time side effect so no bundler has to be
 * told about it. A bare `import './default-directives.js'` is the kind of
 * statement `sideEffects` exists to protect, and protecting it means marking
 * the whole file side-effectful for every consumer.
 *
 * @returns {object} The Directives store.
 */
export const registerDefaultDirectives = () =>
{
	return registerDirectives(coreDirectives, reactiveDirectives, routerDirectives);
};
