import { getParentData } from './get-parent-data.js';

/**
 * This will bind an element to data.
 *
 * @protected
 * @param {object} ele
 * @param {(string|array)} bind
 * @param {*} parent
 */
export const bind = (ele, bind, parent) =>
{
    let data, prop, filter;

    if (typeof bind === 'string')
    {
        data = getParentData(parent);
        if (!data)
        {
            return false;
        }

        prop = bind;
    }
    else if (Array.isArray(bind))
    {
        if ((typeof bind[0] !== 'object'))
        {
            const dataSource = getParentData(parent);
            if (!dataSource)
            {
                return false;
            }
            else
            {
                bind.unshift(dataSource);
            }
        }

        [data, prop, filter] = bind;
    }

    dataBinder.bind(ele, data, prop, filter);
};