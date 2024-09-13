import { BrowserRender } from './browser-render.js';
import { ServerRender } from './server-render.js';

/**
 * RenderController
 *
 * This will set up the render engine.
 *
 * @class
 */
export class RenderController
{
    /**
     * This will check if we are in the browser.
     *
     * @returns {boolean}
     */
    static browserIsSupported()
    {
        return (typeof window !== 'undefined' && typeof document === 'object');
    }

    /**
     * This will create a History Object based on navigation support
     *
     * @returns Render
     */
    static setup()
    {
        if (this.browserIsSupported())
        {
            return new BrowserRender();
        }

        return new ServerRender();
    }
}