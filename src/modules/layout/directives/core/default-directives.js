import { Directives } from '../directives.js';
import { animateIn, animateOut } from './animate/animate.js';
import { addAria, addRole } from './aria/aria.js';
import { addContext, context, useContext } from './context/context-directives.js';
import { data } from './data.js';
import { debug } from './debug.js';
import { addEvent, addState, cache, getId, useData, useParent, useState } from './parent/parent-directives.js';
import { bind } from './reactive/bind.js';
import { addDataSet, addDataStateSet } from './reactive/data-set.js';
import { forEach } from './reactive/for-each.js';
import { map } from './reactive/map.js';
import { onCreated } from './reactive/on-created.js';
import { onDestroyed } from './reactive/on-destroyed.js';
import { onSet } from './reactive/on-set.js';
import { onState } from './reactive/on-state.js';
import { watch } from './reactive/watch.js';
import { addRoute } from './route.js';
import { state } from './state.js';
import { addSwitch } from './switch.js';

Directives
	.add('cache', cache)
	.add('onCreated', onCreated)
	.add('onDestroyed', onDestroyed)
	.add('bind', bind)
	.add('data', data)
	.add('state', state)
	.add('onSet', onSet)
	.add('onState', onState)
	.add('animateIn', animateIn)
	.add('animateOut', animateOut)
	.add('watch', watch)
	.add('useParent', useParent)
	.add('useData', useData)
	.add('useState', useState)
	.add('getId', getId)
	.add('addState', addState)
	.add('addEvent', addEvent)
	.add('map', map)
	.add('for', forEach)
	//.add('html', addHtml)
	.add('useContext', useContext)
	.add('addContext', addContext)
	.add('context', context)
	.add('role', addRole)
	.add('aria', addAria)
	.add('route', addRoute)
	.add('debug', debug)
	.add('dataSet', addDataSet)
	.add('dataStateSet', addDataStateSet)
	.add('switch', addSwitch);