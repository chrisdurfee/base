import { BrowserRender } from './browser-render.js';
import { ServerRender } from './server-render.js';

export class RenderController
{
    /**
     * This will check if browser based navigation is supported
     *
     * @returns boolean
     */
    static browserIsSupported()
    {
        return (window);
    }

    /**
     * This will create a History Object based on navigation support
     *
     * @param {Router} router
     * @returns History
     */
    static setup(router)
    {
        if (this.browserIsSupported())
        {
            return new BrowserRender(router).setup();
        }

        return new ServerRender(router).setup();
    }
}