import { BrowserHistory } from './browser-history.js';
import { HashHistory } from './hash-history.js';

/**
 * HistoryController
 *
 * This will setup the history controller.
 * @class
 */
export class HistoryController
{
    /**
     * This will check if browser based navigation is supported
     *
     * @returns boolean
     */
    static browserIsSupported()
    {
        return (typeof window === 'object' && 'history' in window && 'pushState' in window.history);
    }

    /**
     * This will create a History Object based on navigation support
     *
     * @param {object} router
     * @returns History
     */
    static setup(router)
    {
        if (this.browserIsSupported())
        {
            return new BrowserHistory(router).setup();
        }

        return new HashHistory(router).setup();
    }
}