import { Jot } from "../component/jot.js";
import { Html } from '../html/html.js';
import { Builder } from '../layout/builder.js';

/**
 * This will track previously loaded scripts and styles.
 */
const loaded = [];

/**
 * This will check if a script or style has been loaded.
 *
 * @param {string} src
 * @return {bool}
 */
const isLoaded = (src) => loaded.indexOf(src) !== -1;

/**
 * This will create a script atom.
 *
 * @param {object} props
 * @return {object}
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
 * @return {object}
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
class Group
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
     * @return {void}
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
     * @return {void}
     */
    addFiles(files)
    {
        if (!files)
        {
            return;
        }

        for (var i = 0, length = files.length; i < length; i++)
        {
            var src = files[i];
            if (!isLoaded(src))
            {
                this.add(src);
            }
        }
    }

    /**
     * This will update the progress.
     *
     * @return {void}
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

/**
 * This will load the module.
 *
 * @param {string} src
 * @param {function} callBack
 * @return {object}
 */
const loadModule = (src, callBack) =>
{
    import(src).then(module =>
    {
        if (callBack)
        {
            callBack(module);
        }
    });
};

/**
 * This will check if an object is a contructor.
 *
 * @param {object|function} object
 * @returns {bool}
 */
const isConstructor = (object) =>
{
    if (!object)
    {
        return false;
    }

    return (typeof object?.prototype?.constructor === 'function');
};

/**
 * This will render the module.
 *
 * @param {object} layout
 * @param {object} ele
 * @param {object} parent
 * @param {function} callBack
 * @return {object}
 */
const render = (layout, ele, parent) =>
{
    const frag = Builder.build(layout, null, parent);
    const firstChild = frag.firstChild;
    ele.after(frag);
    return firstChild;
};

/**
 * This will create a comment.
 *
 * @param {object} props
 * @returns {object}
 */
const Comment = (props) => ({
    tag: 'comment',
    text: 'import placeholder',
    onCreated: props.onCreated
});

/**
 * ImportWrapper
 *
 * This will create an import wrapper component that
 * will wrap the comment atom to pass route to the
 * imported layout.
 *
 * @param {object} props
 * @returns {object}
 */
const ImportWrapper = Jot(
{
    /**
     * This will render the import wrapper.
     *
     * @returns {object}
     */
    render()
    {
        /**
         * This will create a comment atom to be replaced
         * by the module.
         */
        return Comment(
        {
            onCreated: (ele) =>
            {
                const src = this.src;
                if (!src)
                {
                    return;
                }

                /**
                 * This will set up a resource group to load the
                 * depends before the module.
                 */
                if (this.depends)
                {
                    const group = new Group(() =>
                    {
                        this.loadAndRender(ele);
                    });

                    group.addFiles(this.depends);
                    return;
                }

                this.loadAndRender(ele);
            }
        });
    },

    /**
     * This will get the layout.
     *
     * @param {object} module
     * @returns {object|null}
     */
    getLayout(module)
    {
        const layout = module.default;
        if (!layout)
        {
            return null;
        }

        /**
         * This will check if the import is useing a custom
         * callback to set up the module.
         */
        const callBack = this.callBack;
        if (callBack)
        {
            layout = callBack(layout);
        }
        else
        {
            if (isConstructor(layout))
            {
                /**
                 * This will set up the layout as a component and pass
                 * the import props like persist and route.
                 */
                layout = new layout();
                layout.route = this.route;

                if (this.persist)
                {
                    layout.persist = true;
                }
            }
            else
            {
                /**
                 * This will set up the layout as a n atom.
                 */
                layout = layout();
            }
        }

        return (this.layout = layout);
    },

    /**
     * This will load the module and render the layout.
     *
     * @param {object} ele
     * @returns {void}
     */
    loadAndRender(ele)
    {
        loadModule(this.src, (module) =>
        {
            this.loaded = true;
            const layout = this.layout || this.getLayout(module);
            this.layoutRoot = render(layout, ele, this.parent);
        });
    },

    /**
     * This will check if the layout should be updated.
     *
     * @param {object} layout
     * @returns {bool}
     */
    shouldUpdate(layout)
    {
        if (this.updateLayout === true)
        {
            return true;
        }

        return (this.updateLayout = (layout && layout.isUnit && typeof layout.update === 'function'));
    },

    /**
     * This will update the module layout.
     *
     * @param {object} params
     * @returns {void}
     */
    updateModuleLayout(params)
    {
        const layout = this.layout;
        if (this.shouldUpdate(layout))
        {
            layout.update(params);
        }
    },

    /**
     * This will call if the import is added to a route. This will pass
     * the update params to the imported layout.
     *
     * @param {object} params
     * @returns {void}
     */
    update(params)
    {
        if (this.loaded === true)
        {
            this.updateModuleLayout(params);
        }
    },

    /**
     * This will remove the imported layout when the
     * comment is being removed.
     *
     * @returns {void}
     */
    beforeDestroy()
    {
        if (!this.layoutRoot)
        {
            return;
        }

        Html.removeElement(this.layoutRoot);
    }
});

/**
 * This will import a module.
 *
 * @param {object} props
 * @returns {object}
 */
export const Import = (props) =>
{
    return new ImportWrapper(props);
};