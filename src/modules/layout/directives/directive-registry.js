import { Directives } from './directives.js';

/**
 * A directive set: a plain table of directive name to handler.
 *
 * @typedef {Record<string, function>} DirectiveSet
 */

/**
 * This will register one or more directive sets.
 *
 * Registration is a table walk rather than a chain of import-time
 * `Directives.add()` calls so a bundle only carries the sets an app asks
 * for. Registering the same name twice replaces the earlier handler, which
 * is how an app overrides a built-in directive.
 *
 * @param {...DirectiveSet} sets
 * @returns {object} The Directives store.
 *
 * @example
 * registerDirectives(coreDirectives, reactiveDirectives);
 */
export const registerDirectives = (...sets) =>
{
	for (let i = 0, len = sets.length; i < len; i++)
	{
		const set = sets[i];
		if (!set)
		{
			continue;
		}

		for (const name in set)
		{
			if (Object.prototype.hasOwnProperty.call(set, name))
			{
				Directives.add(name, set[name]);
			}
		}
	}

	return Directives;
};
