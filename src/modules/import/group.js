import { Builder } from '../layout/builder.js';

/**
 * This will track previously loaded scripts and styles.
 *
 * @type {Array<string>}
 */
const loaded = [];

/**
 * This will check if a script or style has been loaded.
 *
 * @param {string} src
 * @returns {boolean}
 */
const isLoaded = (src) => loaded.indexOf(src) !== -1;

/**
 * This will create a script atom.
 *
 * @param {object} props
 * @returns {object}
 */
const Script = (props) => ({
    tag: 'script',
    src: props.src,
    async: false,
    load(e)
    {
        loaded.push(props.src);

        const callBack = props.load;
        if (callBack)
        {
            callBack();
        }
    }
});

/**
 * This will create a style atom.
 *
 * @param {object} props
 * @returns {object}
 */
const Style = (props) => ({
    tag: 'link',
    rel: 'stylesheet',
    type: 'text/css',
    href: props.src,
    load(e)
    {
        loaded.push(props.src);

        const callBack = props.load;
        if (callBack)
        {
            callBack();
        }
    }
});

/**
 * Group
 *
 * This will setup a depends group to load all
 * dependencies before loaded the script.
 *
 * @class
 */
export class Group
{
    /**
     * This will create a group.
     *
     * @param {function} callBack
     */
    constructor(callBack)
    {
        /**
         * @member {number} percent
         */
        this.percent = 0;

        /**
         * @member {number} loaded
         */
        this.loaded = 0;

        /**
         * @member {number} total
         */
        this.total = 0;

        /**
         * @member {function} callBack
         */
        this.callBack = callBack || null;
    }

    /**
     * This will add the resource to the document.
     *
     * @param {string} src
     * @returns {void}
     */
    add(src)
    {
        this.total++;
        let atom;

        const load = this.update.bind(this);
        if (src.indexOf('.css') !== -1)
        {
            atom = Style({
                load,
                src
            });
        }
        else
        {
            atom = Script({
                load,
                src
            });
        }

        Builder.build(atom, document.head);
    }

    /**
     * This will add the dependencies to the document.
     *
     * @param {array} files
     * @returns {void}
     */
    addFiles(files)
    {
        if (!files)
        {
            return;
        }

        files.forEach(src =>
        {
            if (!isLoaded(src))
            {
                this.add(src);
            }
        });
    }

    /**
     * This will update the progress.
     *
     * @returns {void}
     */
    update()
    {
        const percent = this.updateProgress();
        if (percent < 100)
        {
            return;
        }

        const callBack = this.callBack;
        if (callBack)
        {
            callBack();
        }
    }

    /**
     * This will update the progress.
     *
     * @returns {number}
     */
    updateProgress()
    {
        ++this.loaded;
        return (this.percent = Math.floor(this.loaded / this.total * 100));
    }
}