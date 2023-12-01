import { Directives } from '../directives.js';
import { addContext, context, useContext } from './context/context-directives.js';
import { addState, cache, useData, useParent, useState } from './parent/parent-directives.js';
import { bind } from './reactive/bind.js';
import { forEach } from './reactive/for-each.js';
import { map } from './reactive/map.js';
import { onCreated } from './reactive/on-created.js';
import { onDestroyed } from './reactive/on-destroyed.js';
import { onSet } from './reactive/on-set.js';
import { onState } from './reactive/on-state.js';
import { watch } from './reactive/watch.js';
import { addRoute } from './route.js';
import { addSwitch } from './switch.js';

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