import { dataBinder } from '../../../../data-binder/data-binder.js';
import { getParentData } from './get-parent-data.js';

/**
 * This will bind an element to data.
 *
 * @protected
 * @param {object} ele
 * @param {(string|array)} bind
 * @param {*} parent
 * @returns {void}
 */
export const bind = (ele, bind, parent) =>
{
    let data, prop, filter;

    if (typeof bind === 'string')
    {
        data = getParentData(parent);
        if (!data)
        {
            return;
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
                return;
            }

            data = dataSource;
            prop = bind[0];
            filter = bind[1];
        }
        else
        {
            [data, prop, filter] = bind;
        }
    }

    dataBinder.bind(ele, data, prop, filter);
};