import { Dom } from "../../../../../shared/dom.js";
import { onSet } from "../reactive/on-set.js";
import { onState } from "./on-state.js";

/**
 * This will setup the onSet callBack.
 *
 * @param {Array<any>} dataValue
 * @returns {function}
 */
const onSetCallBack = (dataValue) =>
{
    return (newValue, ele) =>
    {
        const [attr, value, addingString = 'active'] = dataValue;
        const text = (newValue === value)? addingString : "";
        Dom.setData(ele, attr, text);
    };
};

/**
 * This will add data set attibute by binding to the data prop.
 *
 * @param {object} ele
 * @param {Array<any>} attribute
 * @param {object} parent
 * @returns {void}
 */
export const addDataSet = (ele, attribute, parent) =>
{
    if (!attribute)
    {
        return;
    }

    /**
     * This will remove the last value from the attribute array
     * to use as the data value.
     */
    const settings = [...attribute];
    const dataValue = settings.pop();

    /**
     * This will add a callBack to to be used when the
     * data is set.
     */
    settings.push(onSetCallBack(dataValue));
    onSet(ele, settings, parent);
}

/**
 * This will add data set attibute by binding to the data prop.
 *
 * @param {object} ele
 * @param {Array<any>} attribute
 * @param {object} parent
 * @returns {void}
 */
export const addDataStateSet = (ele, attribute, parent) =>
{
    if (!attribute)
    {
        return;
    }

    /**
     * This will remove the last value from the attribute array
     * to use as the data value.
     */
    const settings = [...attribute];
    const dataValue = settings.pop();

    /**
     * This will add a callBack to to be used when the
     * data is set.
     */
    settings.push(onSetCallBack(dataValue));
    onState(ele, settings, parent);
}