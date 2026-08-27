import { bind } from './reactive/bind.js';
import { addDataSet, addDataStateSet } from './reactive/data-set.js';
import { forEach } from './reactive/for-each.js';
import { map } from './reactive/map.js';
import { onSet } from './reactive/on-set.js';
import { onState } from './reactive/on-state.js';
import { watch } from './reactive/watch.js';

/**
 * The directives that subscribe a layout to a data or state source.
 *
 * @type {Record<string, function>}
 */
export const reactiveDirectives =
{
	bind,
	onSet,
	onState,
	watch,
	map,
	for: forEach,
	dataSet: addDataSet,
	dataStateSet: addDataStateSet
};
