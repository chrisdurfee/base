import { Bind } from './reactive/bind.js';
import { onSet } from './reactive/on-set.js';
import { onState } from './reactive/on-state.js';
import { watch } from './reactive/watch.js';
import { map } from './reactive/map.js';
import { forEach } from './reactive/for-each.js';
import { cache, useParent, useData, useState, addState } from './parent/parent-directives.js';
import { useContext, addContext, context } from './context/context-directives.js';
import { onCreated } from './reactive/on-created.js';
import { addRoute } from './route.js';
import { addSwitch } from './switch.js';
import { Directives } from '../directives.js';

Directives
	.add('cache', cache)
	.add('onCreated', onCreated)
	.add('bind', Bind)
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