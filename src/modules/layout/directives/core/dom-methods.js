import { Dom } from "../../../../shared/dom.js";
import { dataBinder } from "../../../data-binder/data-binder.js";
import { Html } from "../../../html/html.js";
import { Builder } from "../../builder.js";

/**
 * This will setup a data watcher.
 *
 * @param {object} ele
 * @param {object} data
 * @param {(function|object)} settings
 * @param {string} parent
 * @returns {void}
 */
export const onUpdate = (ele, data, settings, parent) =>
{
    if (Array.isArray(settings[0]))
    {
        settings.forEach((itemSettings) =>
        {
            if (!itemSettings)
            {
                return;
            }

            onUpdate(ele, data, itemSettings, parent);
        });

        return;
    }

    setWatcher(ele, data, settings, parent);
};

/**
 * This will setup a data watcher.
 *
 * @param {object} ele
 * @param {object} data
 * @param {array} settings
 * @param {string} parent
 * @returns {void}
 */
const setWatcher = (ele, data, settings, parent) =>
{
    let prop,
    callBack;

    if (settings.length < 3)
    {
        [prop, callBack] = settings;
    }
    else
    {
        [data, prop, callBack] = settings;
    }

    if (!data || !prop)
    {
        return;
    }

    const update = getUpdateMethod(ele, prop, callBack, parent);
    dataBinder.watch(ele, data, prop, update);
};

/**
 * This will get the update method.
 *
 * @param {object} ele
 * @param {object} prop
 * @param {*} callBack
 * @param {object} parent
 * @returns {function}
 */
const getUpdateMethod = (ele, prop, callBack, parent) =>
{
    if (typeof callBack === 'object')
    {
        return (value) =>
        {
            addClass(ele, callBack, value);
        };
    }

    return (value) =>
    {
        updateElement(ele, callBack, prop, value, parent);
    };
};

/**
 * This will setup a data watcher.
 *
 * @private
 * @param {object} ele
 * @param {function} callBack
 * @param {string} value
 * @param {object} parent
 */
const updateElement = (ele, callBack, prop, value, parent) =>
{
    let result = callBack(value, ele, parent);
    switch (typeof result)
    {
        case 'object':
            if (parent && result && result.isUnit === true && parent.persist === true && parent.state)
            {
                let key = prop + ':' + value,
                state = parent.state,
                previousResult = state.get(key);
                if (typeof previousResult !== 'undefined')
                {
                    result = previousResult;
                }

                state.set(key, result);
            }
            rebuild(result, ele, parent);
            break;
        case 'string':
            Html.addHtml(ele, result);
            break;
    }
};

/**
 * This will reset an element innerHTML and rebuild.
 *
 * @private
 * @param {object} layout
 * @param {object} ele
 * @param {object} parent
 * @returns {void}
 */
const rebuild = (layout, ele, parent) =>
{
	Builder.rebuild(layout, ele, parent);
};

/**
 * This will add or remove a class from an element.
 *
 * @param {object} ele
 * @param {object} stateStyles
 * @param {*} newValue
 * @returns {void}
 */
const addClass = (ele, stateStyles, newValue) =>
{
    for (const [prop, value] of Object.entries(stateStyles))
    {
        if (!prop)
        {
            continue;
        }

        if (value === newValue)
        {
            Dom.addClass(ele, prop);
        }
        else
        {
            Dom.removeClass(ele, prop);
        }
    }
};