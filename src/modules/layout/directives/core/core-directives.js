import { animateIn, animateOut } from './animate/animate.js';
import { addAria, addRole } from './aria/aria.js';
import { addContext, context, useContext } from './context/context-directives.js';
import { data } from './data.js';
import { debug } from './debug.js';
import { addEvent, addState, cache, getId, useData, useParent, useState } from './parent/parent-directives.js';
import { onCreated } from './reactive/on-created.js';
import { onDestroyed } from './reactive/on-destroyed.js';
import { state } from './state.js';

/**
 * The structural directives every layout needs: caching, identity, parent and
 * context access, lifecycle hooks, aria and the animation hooks.
 *
 * @type {Record<string, function>}
 */
export const coreDirectives =
{
	cache,
	onCreated,
	onDestroyed,
	data,
	state,
	animateIn,
	animateOut,
	useParent,
	useData,
	useState,
	getId,
	addState,
	addEvent,
	useContext,
	addContext,
	context,
	role: addRole,
	aria: addAria,
	debug
};
