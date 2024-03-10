import { Dom } from "../../../../shared/dom.js";
import { dataBinder } from "../../../data-binder/data-binder.js";
import { Html } from "../../../html/html.js";
import { Builder } from "../../builder.js";

/**
 * This will setup a data watcher.
 *
 * @param {object} ele
 * @param {object} data
 * @param {string} prop
 * @param {(function|object)} callBack
 * @param {string} parent
 * @return {void}
 */
export const onUpdate = (ele, data, settings, parent) =>
{
    let prop,
    callBack,
    update;

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

    switch (typeof callBack)
    {
        case 'object':
            update = (value) =>
            {
                addClass(ele, callBack, value);
            };
            break;
        case 'function':
            update = (value) =>
            {
                updateElement(ele, callBack, prop, value, parent);
            };
            break;
    }

    dataBinder.watch(ele, data, prop, update);
};

/**
 * This will setup a data watcher.
 *
 * @private
 * @param {object} ele
 * @param {function} callBack
 * @param {string} value
 * @param {string} parent
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