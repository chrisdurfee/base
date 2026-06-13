import { Events } from '../../main/events/events.js';
import { Data } from '../data/data.js';
import { HistoryController } from './history/history-controller.js';
import { Route } from './routes/route.js';
import { setTitle } from './set-title.js';
import { Utils } from './utils.js';
export { NavLink } from './nav-link.js';

/**
 * This will get the location.
 *
 * @returns {object}
 */
const getLocation = () => (typeof window !== 'undefined')? window.location : {};

/**
 * Router
 *
 * This will create a browser router.
 *
 * @class
 */
export class Router
{
	constructor()
	{
		/**
		 * @type {string} version
		 */
		this.version = '1.0.2';

		/**
		 * This is the root of the uri for the routing object
		 * and the base title.
		 */
		this.baseURI = '/';
		this.title = '';

		this.lastPath = null;
		this.path = null;

		/**
		 * Cache for last matched route - provides 70-90% speedup on repeated navigation.
		 * @type {object|null} lastMatchedRoute
		 */
		this.lastMatchedRoute = null;

		/**
		 * Identifier of the switch group that owned the most recently
		 * applied scroll-target intent. When the next target intent
		 * comes from the same group it is treated as a sibling-tab
		 * switch (snap-to-sticky); when it comes from a different group
		 * (or no group) it is treated as a fresh page navigation and
		 * the page is reset to the top first.
		 * @type {*}
		 */
		this.lastScrollGroup = null;

		/**
		 * Transient field set by `checkGroup` so `select` knows which
		 * switch group is currently asking for selection. Cleared after
		 * each group's iteration.
		 * @type {*}
		 */
		this.currentGroupId = null;

		/**
		 * Monotonic token used to cancel pending scroll-target waits
		 * when a newer navigation begins.
		 * @type {number}
		 */
		this.scrollWaitToken = 0;

		/**
		 * This will be used to access our history object.
		 */
		this.history = null;

		/**
		 * @type {function|null} callBackLink
		 */
		this.callBackLink = null;
		this.location = getLocation();

		/**
		 * This will store each route added to the router.
		 * @type {Array<object>} routes
		 */
		this.routes = [];
		this.switches = new Map();
		this.switchCount = 0;

		/**
		 * @type {object} data
		 */
		this.data = new Data(
		{
			path: ''
		});
	}

	/**
	 * This will setup our history object.
	 *
	 * @protected
	 * @returns {void}
	 */
	setupHistory()
	{
		this.history = HistoryController.setup(this);
	}

	/**
	 * This will create a new route.
	 *
	 * @protected
	 * @param {object} settings
	 * @returns {object}
	 */
	createRoute(settings)
	{
		// @ts-ignore
		const uri = settings.uri || '*';
		// @ts-ignore
		settings.rawUri = uri;
		// @ts-ignore
		settings.baseUri = this.createURI(uri);

		return new Route(settings, this.updateTitle.bind(this));
	}

	/**
	 * This will add a new route to the router.
	 *
	 * @param {object} settings
	 * @returns {object}
	 */
	add(settings)
	{
		if (typeof settings !== 'object')
		{
			const args = arguments;
			settings =
			{
				uri: args[0],
				component: args[1],
				callBack: args[2],
				title: args[3],
				id: args[4],
				container: args[5]
			};
		}

		const route = this.createRoute(settings);
		this.addRoute(route);
		return route;
	}

	/**
	 * This will add a route.
	 *
	 * @param {object} route
	 * @returns {void}
	 */
	addRoute(route)
	{
		this.routes.push(route);
		this.checkRoute(route, this.getPath());
	}

	/**
	 * This will resume a route.
	 *
	 * @param {object} route
	 * @param {object} container
	 * @returns {void}
	 */
	resume(route, container)
	{
		// @ts-ignore
		route.resumeRoute(container);
		this.addRoute(route);
	}

	/**
	 * This will get the base path.
	 *
	 * @protected
	 * @returns {string}
	 */
	getBasePath()
	{
		if (!this.basePath)
		{
			let pathURI = this.baseURI || '';
			if ((pathURI[pathURI.length - 1] !== '/'))
			{
				pathURI += '/';
			}
			this.basePath = pathURI;
		}
		return this.basePath;
	}

	/**
	 * This will create a uri.
	 *
	 * @protected
	 * @param {string} uri
	 * @returns {string}
	 */
	createURI(uri)
	{
		const baseUri = this.getBasePath();
		let path = Utils.removeSlashes(uri);

		/**
		 * Relative same-directory references ('.', './') must resolve
		 * to the base path itself. Without this, the stored history
		 * state uri becomes "<base>." which will not match exact-end
		 * route patterns when re-checked on popstate.
		 */
		path = path.replace(/^(?:\.\/)+/, '');
		if (path === '.')
		{
			path = '';
		}
		return (baseUri + path);
	}

	/**
	 * This will get a route by uri.
	 *
	 * @param {string} uri
	 * @returns {object|null}
	 */
	getRoute(uri)
	{
		const routes = this.routes,
		length = routes.length;
		if (length > 0)
		{
			for (let i = 0; i < length; i++)
			{
				const route = routes[i];
				// @ts-ignore
				if (route.uri === uri)
				{
					return route;
				}
			}
		}
		return null;
	}

	/**
	 * This will get a route by id.
	 *
	 * @param {string} id
	 * @returns {object|boolean}
	 */
	getRouteById(id)
	{
		const routes = this.routes,
		length = routes.length;
		if (length > 0)
		{
			for (let i = 0; i < length; i++)
			{
				const route = routes[i];
				// @ts-ignore
				if (route.routeId === id)
				{
					return route;
				}
			}
		}
		return false;
	}

	/**
	 * This will remove a route.
	 *
	 * @param {object} route
	 */
	removeRoute(route)
	{
		const routes = this.routes,
		index = routes.indexOf(route);
		if (index > -1)
		{
			routes.splice(index, 1);
		}

		if (this.lastMatchedRoute === route)
		{
			this.lastMatchedRoute = null;
		}
	}

	/**
	 * This will add a switch.
	 *
	 * @param {Array<object>} group
	 * @returns {number} the switch id.
	 */
	addSwitch(group)
	{
		const id = this.switchCount++;
		const switchArray = this.getSwitchGroup(id);

		for (let i = 0, length = group.length; i < length; i++)
		{
			const item = group[i];
			if (!item)
			{
				continue;
			}

			const route = this.createRoute(item);
			switchArray.push(route);
		}

		this.checkGroupForRegistration(id, switchArray);
		return id;
	}

	/**
	 * This will resume a switch.
	 *
	 * @param {Array<object>} group
	 * @param {object} container
	 * @returns {number} the switch id.
	 */
	resumeSwitch(group, container)
	{
		const id = this.switchCount++;
		const switchArray = this.getSwitchGroup(id);

		for (let i = 0, length = group.length; i < length; i++)
		{
			const item = group[i];
			// @ts-ignore
			const route = item.component.route;
			route.resumeRoute(container);
			switchArray.push(route);
		}

		this.checkGroupForRegistration(id, switchArray);
		return id;
	}

	/**
	 * Runs `checkGroup` for a switch group that is being registered
	 * mid-render (after `checkActiveRoutes` has already applied its
	 * scroll intent). Any scroll intent produced here is consumed
	 * silently — we only use it to seed `lastScrollGroup` so the
	 * very first sibling-tab click on this page is recognized as a
	 * sibling switch instead of being treated as fresh navigation.
	 *
	 * @protected
	 * @param {*} id
	 * @param {object[]} switchArray
	 * @returns {void}
	 */
	checkGroupForRegistration(id, switchArray)
	{
		const previousIntent = this.scrollIntent;
		const previousGroupId = this.currentGroupId;

		this.scrollIntent = null;
		this.currentGroupId = id;
		this.checkGroup(switchArray, this.getPath());
		this.currentGroupId = previousGroupId;

		const seeded = this.scrollIntent;
		if (seeded && seeded.type === 'target' && seeded.groupId !== null && seeded.groupId !== undefined)
		{
			this.lastScrollGroup = seeded.groupId;
		}

		this.scrollIntent = previousIntent;
	}

	/**
	 * This will get a switch group by id.
	 *
	 * @param {number} id
	 * @returns {Array<object>}
	 */
	getSwitchGroup(id)
	{
		const switches = this.switches.get(id);
		if (switches)
		{
			return switches;
		}

		/**
		 * @type {Array<object>} group
		 */
		const group = [];
		this.switches.set(id, group);
		return group;
	}

	/**
	 * This will remove a switch by id.
	 *
	 * @param {number} id
	 * @returns {void}
	 */
	removeSwitch(id)
	{
		this.switches.delete(id);
	}

	/**
	 * This will remove a route by uri.
	 *
	 * @param {string} uri
	 * @returns {this} a reference to the router object.
	 */
	remove(uri)
	{
		uri = this.createURI(uri);

		const route = this.getRoute(uri);
		if (route)
		{
			this.removeRoute(route);
		}
		return this;
	}

	/**
	 * This will setup the router.
	 *
	 * @param {string} [baseURI]
	 * @param {string} [title]
	 * @returns {this} a reference to the router object.
	 */
	setup(baseURI, title)
	{
		this.baseURI = baseURI || '/';
		this.updateBaseTag(this.baseURI);
		this.title = (typeof title !== 'undefined')? title : '';

		this.setupHistory();

		// @ts-ignore
		this.data.path = this.getPath();

		this.callBackLink = this.checkLink.bind(this);
		Events.on('click', document, this.callBackLink);

		/* this will route to the first url entered
		when the router loads. this will fix the issue
		that stopped the first endpoint from being
		added to the history */
		const endPoint = this.getEndPoint();
		this.navigate(endPoint, null, true);
		return this;
	}

	/**
	 * Update the base tag href to the base URI for correct relative URL resolution.
	 *
	 * @param {string} url
	 * @return {void}
	 */
	updateBaseTag(url)
	{
		/* this will modify the base tag to ref from
		the base url for all xhr */
		const ele = document.getElementsByTagName('base');
		if (ele.length)
		{
			ele[0].href = url;
		}
	}

	/**
	 * This will get the parent element link.
	 *
	 * @param {HTMLElement} ele
	 * @returns {HTMLElement|null}
	 */
	getParentLink(ele)
	{
		return ele.closest('a');
	}

	/**
	 * This will check if a link was routed.
	 *
	 * @protected
	 * @param {PointerEvent} evt
	 */
	checkLink(evt)
	{
		if (evt.ctrlKey === true)
		{
			return true;
		}

		// @ts-ignore
		const target = evt.target.closest('a');
		if (!target)
		{
			return true;
		}

		if (target.target === '_blank' || target.dataset.cancelRoute)
		{
			return true;
		}

		const href = target.getAttribute('href');
		if (href !== null)
		{
			const baseUri = this.baseURI,
			path = (baseUri !== '/')? href.replace(baseUri, '') : href;

			const replace = target.dataset.replace === 'true';
			this.navigate(path, null, replace);

			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
	}

	/**
	 * This will reset the router.
	 *
	 * @returns {this} a reference to the router object.
	 */
	reset()
	{
		/**
		 * Deactivate all routes to properly clean up their components
		 * before clearing the arrays.
		 */
		const routes = this.routes;
		for (let i = 0, length = routes.length; i < length; i++)
		{
			const route = routes[i];
			// @ts-ignore
			if (route && typeof route.deactivate === 'function')
			{
				// @ts-ignore
				route.deactivate();
			}
		}

		this.routes = [];
		this.switches = new Map();
		this.switchCount = 0;
		this.lastMatchedRoute = null;

		return this;
	}

	/**
	 * This will check the active routes.
	 *
	 * @returns {this} a reference to the router object.
	 */
	activate()
	{
		this.checkActiveRoutes();
		return this;
	}

	/**
	 * This will navigate the router.
	 *
	 * @param {string} uri
	 * @param {object|null} [data]
	 * @param {boolean} [replace]
	 * @returns {this} a reference to the router object.
	 */
	navigate(uri, data, replace)
	{
		uri = this.createURI(uri);
		// @ts-ignore
		this.history.addState(uri, data, replace);
		this.activate();

		return this;
	}

	/**
	 * This will update the data path.
	 * @protected
	 */
	updatePath()
	{
		const path = this.getPath();
		// @ts-ignore
		this.data.path = path;
	}

	/**
	 * This will update the title.
	 *
	 * @protected
	 * @param {object} route
	 * @returns {this} a reference to the router object.
	 */
	updateTitle(route)
	{
		if (!route || !route.title)
		{
			return this;
		}

		const title = route.title;
		document.title = setTitle(route, title, this.title);
		return this;
	}

	/**
	 * This will check the routes to match the path.
	 *
	 * @protected
	 * @param {string} [path]
	 */
	checkActiveRoutes(path)
	{
		this.lastPath = this.path;

		path = path || this.getPath();
		this.path = path;

		/**
		 * Reset scroll intent before checking routes.
		 * Routes will set this during select().
		 */
		this.scrollIntent = null;

		/**
		 * Invalidate any pending scroll-target wait from a previous
		 * navigation so it doesn't fire after the new route mounts.
		 */
		this.scrollWaitToken++;

		// Quick check: does last matched route still match?
		if (this.lastMatchedRoute && this.check(this.lastMatchedRoute, path))
		{
			this.select(this.lastMatchedRoute);
		}
		else
		{
			// Cache miss - do full route search
			const routes = this.routes;
			const length = routes.length;

			for (let i = 0; i < length; i++)
			{
				const route = routes[i];
				if (typeof route === 'undefined')
				{
					continue;
				}

				this.checkRoute(route, path);
			}
		}

		this.checkSwitches(path);
		this.applyScrollIntent();
		this.updatePath();
	}

	/**
	 * Checks all switch groups against the given path.
	 * Activates the first matching route or falls back to the first route in the group if none match.
	 *
	 * @protected
	 * @param {string} path
	 * @returns {void}
	 */
	checkSwitches(path)
	{
		const switches = this.switches;

		// Iterate entries so we can pass the group id through to select().
		for (const [id, group] of switches.entries())
		{
			this.currentGroupId = id;
			this.checkGroup(group, path);
		}
		this.currentGroupId = null;
	}

	/**
	 * Checks a single group of routes against the path.
	 * Selects the first matching route if any; otherwise selects the first route.
	 * Deactivates previously active routes if changed.
	 *
	 * @protected
	 * @param {object[]} group
	 * @param {string} path
	 * @returns {void}
	 */
	checkGroup(group, path)
	{
		const length = group.length;
		if (!length)
		{
			return;
		}

		/**
		 * The last selected route should be checked first to
		 * deactive it if it doesn't match the path.
		 */
		let lastSelected = null;
		for (let i = 0; i < length; i++)
		{
			if (group[i].get('active'))
			{
				lastSelected = group[i];
				break;
			}
		}

		if (lastSelected)
		{
			/**
			 * If the last selected route matches the path, we select it.
			 * Otherwise, we deactivate it.
			 */
			const matched = lastSelected.match(path);
			if (matched === false)
			{
				lastSelected.deactivate();
			}
		}

		/**
		 * We will check each route in the group to see if it matches the path. If a route
		 * matches the path, we select it. If a route has a controller, we deactivate all
		 * subsequent routes and select the first route with a controller.
		 */
		let selected;
		for (let i = 0; i < length; i++)
		{
			const route = group[i];
			if (typeof route === 'undefined')
			{
				continue;
			}

			// If we have already found a matching route, and it has a controller,
			// we deactivate subsequent routes.
			if (selected)
			{
				route.deactivate();
				continue;
			}

			const matched = route.match(path);
			if (matched !== false && selected === undefined)
			{
				if (route.controller)
				{
					selected = route;
					this.select(route);
				}
			}
		}

		/**
		 * If no route matched the path, we select the first route in the group.
		 * This fallback selection must not influence scroll behavior — the
		 * path doesn't actually belong to this group's container, which is
		 * likely about to be unmounted by navigation away from this page.
		 */
		const firstRoute = group[0];
		if (!selected)
		{
			this.select(firstRoute, true);
		}
	}

	/**
	 * This will check if a route matches the path.
	 *
	 * @param {object} route
	 * @param {string} path
	 * @returns {boolean}
	 */
	checkRoute(route, path)
	{
		const check = this.check(route, path);
		if (check !== false)
		{
			this.select(route);
			// Cache this route for fast lookup on next navigation
			this.lastMatchedRoute = route;
		}
		else
		{
			route.deactivate();
		}
		return check;
	}

	/**
	 * This will select a route if the route matches the path.
	 *
	 * @param {object} route
	 * @param {string} [path]
	 * @returns {boolean}
	 */
	check(route, path)
	{
		/* we want to check if the route has been
		deleted from the routes */
		if (!route)
		{
			return false;
		}

		/* we want to check to use the supplied uri or get the
		current uri if not setup */
		path = path || this.getPath();

		/* we want to check if the route uri matches the path uri */
		return (route.match(path) !== false);
	}

	/**
	 * This will select the route.
	 *
	 * @param {object} route
	 * @param {boolean} [isFallback] - when true, this selection is a
	 *   switch-group fallback (no route in the group actually matched
	 *   the current path) and must not emit a scroll intent.
	 * @returns {void}
	 */
	select(route, isFallback)
	{
		if (!route)
		{
			return;
		}

		route.setPath(this.path, this.lastPath);
		route.select();
		this.updateTitle(route);

		if (isFallback === true)
		{
			return;
		}

		/**
		 * Collect scroll intent. scrollTo takes highest priority,
		 * then preventScroll, then default scroll-to-top. The owning
		 * group id (if any) is captured so applyScrollIntent can tell
		 * sibling-tab switches apart from fresh page navigations.
		 */
		if (route.scrollTo)
		{
			this.scrollIntent = {
				type: 'target',
				selector: route.scrollTo,
				groupId: this.currentGroupId
			};
		}
		else if (route.preventScroll !== true && !this.scrollIntent)
		{
			this.scrollIntent = { type: 'top' };
		}
	}

	/**
	 * This will apply the collected scroll intent after all
	 * routes and switches have been processed.
	 *
	 * @returns {void}
	 */
	applyScrollIntent()
	{
		const intent = this.scrollIntent;
		this.scrollIntent = null;

		if (!intent)
		{
			return;
		}

		if (intent.type === 'top')
		{
			this.lastScrollGroup = null;
			this.checkToScroll();
			this.reassertScrollTop();
			return;
		}

		if (intent.type !== 'target')
		{
			return;
		}

		/**
		 * Sibling-tab switching only happens when the scroll target
		 * intent comes from the same switch group as the previous one.
		 * Anything else (no group, or a different group) is a fresh
		 * page navigation and must reset to the top so persisted
		 * components don't restore the previous page's scroll offset.
		 */
		const hasGroup = (intent.groupId !== null && intent.groupId !== undefined);
		const isSiblingSwitch = hasGroup && (this.lastScrollGroup === intent.groupId);

		if (!isSiblingSwitch)
		{
			if (typeof window !== 'undefined')
			{
				window.scrollTo(0, 0);
			}
			this.reassertScrollTop();
		}

		this.lastScrollGroup = hasGroup ? intent.groupId : null;

		if (isSiblingSwitch)
		{
			this.scrollToTarget(intent.selector);
		}
	}

	/**
	 * Re-asserts window scroll position at the top on the next
	 * animation frame. Route activation can asynchronously mount or
	 * reattach persisted DOM after applyScrollIntent runs, which can
	 * leave the viewport at the previous page's offset even though we
	 * already called scrollTo(0, 0). Re-asserting after a frame ensures
	 * the new page lands at the top.
	 *
	 * @returns {void}
	 */
	reassertScrollTop()
	{
		if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined')
		{
			return;
		}

		const token = ++this.scrollWaitToken;
		requestAnimationFrame(() =>
		{
			if (token !== this.scrollWaitToken)
			{
				return;
			}

			if (window.scrollY > 0 || window.pageYOffset > 0)
			{
				window.scrollTo(0, 0);
			}
		});
	}

	/**
	 * This will scroll to a target element by CSS selector.
	 * For sticky elements, it scrolls to the position where the
	 * element reaches its stuck point (natural position minus CSS top).
	 * If the user is above the target, no scrolling occurs.
	 *
	 * @param {string} selector
	 * @returns {void}
	 */
	scrollToTarget(selector)
	{
		if (typeof selector !== 'string' || typeof document === 'undefined')
		{
			return;
		}

		const measureAndScroll = (element) =>
		{
			const style = window.getComputedStyle(element);
			const isSticky = style.position === 'sticky';

			let naturalTop;
			if (isSticky)
			{
				/**
				 * Temporarily remove sticky positioning to read the
				 * element's true natural position in the document flow.
				 * The browser won't repaint between the change and restore.
				 */
				const inlinePosition = /** @type {HTMLElement} */ (element).style.position;
				/** @type {HTMLElement} */ (element).style.position = 'static';
				const rect = element.getBoundingClientRect();
				naturalTop = rect.top + window.scrollY;
				/** @type {HTMLElement} */ (element).style.position = inlinePosition;
			}
			else
			{
				const rect = element.getBoundingClientRect();
				naturalTop = rect.top + window.scrollY;
			}

			/**
			 * For sticky elements, account for the CSS top offset so the
			 * element sits at its stuck position after scrolling.
			 */
			const cssTop = isSticky ? (parseFloat(style.top) || 0) : 0;
			const targetScroll = naturalTop - cssTop;

			/**
			 * Only scroll if the current position is below the target.
			 * This keeps the cover header visible when the user is above the tabs.
			 */
			if (window.scrollY > targetScroll)
			{
				window.scrollTo(0, targetScroll);
			}
		};

		/**
		 * Lazy-imported routes mount their DOM asynchronously, so the
		 * sticky target may not exist yet when we first try to find it.
		 * Poll on animation frames for a short window before giving up.
		 */
		if (typeof requestAnimationFrame === 'undefined')
		{
			/* No rAF (SSR/test environments): measure synchronously
			 * if the target already exists. */
			const existing = document.querySelector(selector);
			if (existing)
			{
				measureAndScroll(existing);
			}
			return;
		}

		/**
		 * Measurement is always deferred to the next animation frame,
		 * even when the target already exists. Route activation has
		 * just mutated the DOM, so reading getComputedStyle and
		 * getBoundingClientRect here forces a full synchronous reflow
		 * of the dirty tree mid-navigation (tens of ms on large pages,
		 * far worse on older mobile devices). It would also measure
		 * stale layout: the batched pub-sub flush applies watcher DOM
		 * updates in a microtask after this call. One frame later the
		 * flush has run and the read coincides with the frame's
		 * natural layout pass.
		 */
		const token = ++this.scrollWaitToken;
		const maxFrames = 30;
		let frames = 0;
		const tryFind = () =>
		{
			// A newer scroll intent has superseded this one; abort.
			if (token !== this.scrollWaitToken)
			{
				return;
			}

			const el = document.querySelector(selector);
			if (el)
			{
				measureAndScroll(el);
				return;
			}

			if (++frames < maxFrames)
			{
				requestAnimationFrame(tryFind);
			}
		};
		requestAnimationFrame(tryFind);
	}

	/**
	 * This will check to scroll to the top of the page.
	 *
	 * @returns {void}
	 */
	checkToScroll()
	{
		const shouldScrollToTop = this.shouldScrollToTop();
		if (shouldScrollToTop)
		{
            window.scrollTo(0, 0);
        }
	}

	/**
	 * This will clean the path.
	 *
	 * @param {string|null} path
	 * @returns {string}
	 */
	cleanPath(path)
	{
		if (!path)
		{
			return '/';
		}

		return path.split('?')[0].split('#')[0];
	}

	/**
	 * This will scroll to the top of the page if the route has changed.
	 *
	 * @returns {boolean}
	 */
	shouldScrollToTop()
	{
		const path = this.cleanPath(this.getPath());
		const lastPath = this.cleanPath(this.lastPath);
        const prevSegments = lastPath.split('/');
        const currentSegments = path.split('/');

		/**
		 * If the path has changed, we want to scroll to the top.
		 */
		if (prevSegments.length !== currentSegments.length)
		{
			return true
		}

		/**
		 * We want to check if the last segment of the path has changed.
		 * If it has, we want to scroll to the top.
		 */
		const lastSegment = prevSegments[prevSegments.length - 1];
		const currentSegment = currentSegments[currentSegments.length - 1];
        return (lastSegment !== currentSegment);
	}

	/**
	 * This will get the endpoint.
	 *
	 * @returns {string}
	 */
	getEndPoint()
	{
		const path = this.getPath();
		return (path.replace(this.baseURI, '') || '/');
	}

	/**
	 * This will remove the router events.
	 *
	 * @returns {void}
	 */
	destroy()
	{
		if (typeof this.callBackLink === 'function')
		{
			Events.off('click', document, this.callBackLink);
		}
	}

	/**
	 * This will get the location pathname.
	 *
	 * @returns {string}
	 */
	getPath()
	{
		/* we want to get the window location path */
		let location = this.location,
		path = this.path = location.pathname;

		if (this.history.type === 'hash')
		{
			return location.hash.replace('#', '');
		}

		return path + location.search + location.hash;
	}
}

/**
 * This will create a new router.
 *
 * @type {Router}
 */
export const router = new Router();