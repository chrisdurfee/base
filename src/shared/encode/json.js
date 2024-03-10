/**
 * This will store the replacements.
 *
 * @type {object} replacements
 */
const replacements = { '\n': '\\n', '\r': '\\n', '\t': '\\t' };

/**
 * This will escape chars.
 *
 * @param {string} str
 * @returns {string}
 */
const escapeChars = (str, removeNewLines) =>
{
    if (typeof str !== 'string')
    {
        str = String(str);
    }

    const pattern = removeNewLines ? /[\n\r\t]/g : /\t/g;
    return str.replace(pattern, match => replacements[match]);
};

/**
 * This will sanitize the text.
 *
 * @param {string} text
 * @param {boolean} [removeNewLines]
 * @returns {string}
 */
const sanitize = (text, removeNewLines) =>
{
    if (typeof text !== 'string')
    {
        return text;
    }

    /* we need to escape chars and encode the uri
    components */
    text = escapeChars(text, removeNewLines);
    text = encodeURIComponent(text);

    /* we want to re-encode the double quotes so they
    will be escaped by the json encoder */
    const pattern = /%22/g;
    return text.replace(pattern, '"');
};

/**
 * This will prepare the url.
 *
 * @param {*} data
 * @param {boolean} [removeNewLines]
 * @returns {string}
 */
export const prepareUrl = (data, removeNewLines) =>
{
    const type = typeof data;
    if (type === "undefined")
    {
        return data;
    }

    if (type !== 'object')
    {
        data = sanitize(data);
        return data;
    }

    Object.entries(data).forEach(([prop, value]) =>
    {
        if (value === null)
        {
            return;
        }

        data[prop] = (typeof value === 'string') ? prepareUrl(value, removeNewLines) : sanitize(value, removeNewLines);
    });
    return data;
};

/**
 * This will parse JSON data.
 *
 * @param {string} data
 * @returns {*}
 */
export function decode(data)
{
    return (typeof data !== "undefined" && data.length > 0)? JSON.parse(data) : false;
}

/**
 * This will encode JSON data.
 *
 * @param {*} data
 * @returns {?string}
 */
export function encode(data)
{
    return (typeof data !== "undefined")? JSON.stringify(data) : null;
}