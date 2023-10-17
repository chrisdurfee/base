import {base} from '../../core.js';
import {dataBinder} from '../data-binder/data-binder.js';
import {htmlBuilder, normalizeAttr, removeEventPrefix} from '../html-builder/html-builder.js';
import {Directives} from './directives/directives.js';
import {WatcherHelper} from './watcher-helper.js';
import {Jot} from "../component/jot.js";

/**
 * This will add a switch.
 *
 * @protected
 * @param {object} ele
 * @param {array} group
 * @param {object} parent
 */
export const addSwitch = (ele, group, parent) =>
{
	let route = group[0];
	// this will check to resume switch
	// if(this.checkResume(route))
	// {
	// 	this.resumeSwitch(ele, group);
	// 	return;
	// }

	for(var i = 0, length = group.length; i < length; i++)
	{
		route = group[i];
		route.container = ele;
		route.parent = parent;
	}

	let id = base.router.addSwitch(group);
	this.trackSwitch(ele, id);
};

// const resumeSwitch = (ele, group) =>
// {
// 	let id = base.router.resumeSwitch(group, ele);
// 	this.trackSwitch(ele, id);
// }

/**
 * This will track a switch.
 *
 * @param {object} ele
 * @param {int} id
 */
const trackSwitch = (ele, id) =>
{
	base.dataTracker.add(ele, 'switch',
	{
		id
	});
};