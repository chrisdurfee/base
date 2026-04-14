import { Events } from "../../../main/events/events.js";
import { History } from "./history.js";

/**
 * Detect iOS Safari/PWA environment once at module load.
 * iOS has a compositor bug where swipe-back navigation can leave
 * the hit-test layer out of sync with the visual rendering.
 *
 * @returns {boolean}
 */
const isIOS = typeof navigator !== 'undefined'
	&& /iPad|iPhone|iPod/.test(navigator.userAgent || '')
	// @ts-ignore - MSStream exists only in IE/Edge legacy
	&& !window.MSStream;

/**
 * Force iOS WebKit to rebuild its hit-test region tree.
 *
 * After popstate navigation (swipe-back) the compositor's cached
 * scroll offset can get out of sync with the actual document
 * scroll, causing touch targets to be misaligned. A scroll event
 * or device rotation forces WebKit to recalculate. This function
 * replicates that by re-applying the current scroll position and
 * forcing a synchronous reflow after the DOM has settled.
 *
 * @returns {void}
 */
const forceHitTestUpdate = () =>
{
	if (!isIOS)
	{
		return;
	}

	/* Double-rAF so the route's DOM is fully rendered and
	scroll position is committed. */
	requestAnimationFrame(() => requestAnimationFrame(() =>
	{
		const x = window.scrollX;
		const y = window.scrollY;

		/* Re-apply the current scroll position. Even if the
		values haven't changed, scrollTo triggers WebKit's
		internal scroll handling which rebuilds hit-test
		regions. Pair with a synchronous reflow read to ensure
		the compositor acknowledges the geometry. */
		window.scrollTo(0, y + 1);
		void document.documentElement.offsetHeight;
		window.scrollTo(x, y);
	}));
};

/**
 * BrowserHistory
 *
 * This will setup the history controller.
 *
 * @class
 */
export class BrowserHistory extends History
{
	/**
	 * This will add the events.
	 *
	 * @returns {this} a reference to the object.
	 */
	addEvent()
	{
		Events.on('popstate', window, this.callBack);

		/**
		 * Handle bfcache restoration on iOS. When a page is
		 * restored from the back-forward cache the compositor
		 * may need to be nudged.
		 */
		if (isIOS)
		{
			this.pageShowCallBack = this.onPageShow.bind(this);
			Events.on('pageshow', window, this.pageShowCallBack);
		}

		return this;
	}

	/**
	 * This will remove the events.
	 *
	 * @returns {this} a reference to the object.
	 */
	removeEvent()
	{
		Events.off('popstate', window, this.callBack);

		if (this.pageShowCallBack)
		{
			Events.off('pageshow', window, this.pageShowCallBack);
		}

		return this;
	}

	/**
	 * Handles the pageshow event for bfcache restoration.
	 *
	 * @param {PageTransitionEvent} evt
	 * @returns {void}
	 */
	onPageShow(evt)
	{
		if (evt.persisted)
		{
			forceHitTestUpdate();
		}
	}

	/**
	 * This will check to activate the router.
	 *
	 * @param {PointerEvent} evt
	 */
	check(evt)
	{
		/* we want to check if the event has a state and if the
		state location is from the background */
		// @ts-ignore
		const state = evt.state;
		if (!state || state.location !== this.locationId)
		{
			return false;
		}

		evt.preventDefault();
		evt.stopPropagation();

		// @ts-ignore
		this.router.checkActiveRoutes(state.uri);

		const scrollPosition = state.scrollPosition;
		if (scrollPosition)
		{
			this.scrollTo(scrollPosition);
		}

		forceHitTestUpdate();
	}

	/**
	 * This will create a state object.
	 *
	 * @param {string} uri
	 * @param {object|null} data
	 * @returns {object}
	 */
	createState(uri, data = {})
	{
		const scrollPosition = this.getScrollPosition();
		data = (data === null)? {} : data;

		return {
			location: this.locationId,
			...data,
			scrollPosition,
			uri
		};
	}

	/**
	 * This will add a state to the history.
	 *
	 * @param {string} uri
	 * @param {object|null} data
	 * @param {boolean} replace
	 * @returns {this} a reference to the object.
	 */
	addState(uri, data, replace = false)
	{
		const history = window.history,
		lastState = history.state;
		if (lastState && lastState.uri === uri)
		{
			return this;
		}

		/* Before pushing a new entry, snapshot the current scroll
		position into the CURRENT state. Without this the leaving
		page's scroll offset is lost and popstate (swipe-back)
		restores the wrong position, which on iOS causes the
		compositor hit-test layer to desync. */
		if (!replace && lastState && lastState.location === this.locationId)
		{
			lastState.scrollPosition = this.getScrollPosition();
			history.replaceState(lastState, '', window.location.href);
		}

		const stateObj = this.createState(uri, data);

		/* For a new (push) entry the page has not been viewed yet,
		so its scroll position must start at the top. createState
		captures the *current* scroll which still belongs to the
		page we are leaving. Override it to avoid restoring a
		stale offset the next time this entry is popped. The real
		scroll position will be snapshotted via replaceState when
		the user navigates away from this new page. */
		if (!replace)
		{
			stateObj.scrollPosition = { x: 0, y: 0 };
		}

		const method = (replace === false)? 'pushState' : 'replaceState';
		// @ts-ignore
		history[method](stateObj, null, uri);

		return this;
	}
}