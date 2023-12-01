import { addContext, context, useContext } from './core/context/context-directives.js';
import { addState, cache, useData, useParent, useState } from './core/parent/parent-directives.js';
import { forEach } from './core/reactive/for-each.js';
import { map } from './core/reactive/map.js';
import { onCreated } from './core/reactive/on-created.js';
import { onDestroyed } from './core/reactive/on-destroyed.js';
import { onSet } from './core/reactive/on-set.js';
import { onState } from './core/reactive/on-state.js';
import { watch } from './core/reactive/watch.js';
import { addRoute } from './core/route.js';
import { addSwitch } from './core/switch.js';

Directives
	.add('cache', cache)
	.add('onCreated', onCreated)
	.add('onDestroyed', onDestroyed)
	.add('bind', bind)
	.add('onSet', onSet)
	.add('onState', onState)
	.add('watch', watch)
	.add('useParent', useParent)
	.add('useData', useData)
	.add('useState', useState)
	.add('addState', addState)
	.add('map', map)
	.add('for', forEach)
	.add('html', addHtml)
	.add('useContext', useContext)
	.add('addContext', addContext)
	.add('context', context)
	.add('role', addRole)
	.add('aria', addAria)
	.add('route', addRoute)
	.add('switch', addSwitch);