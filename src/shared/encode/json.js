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

    if (removeNewLines)
    {
        const newLine = /(\n|\r\n)/g;
        str = str.replace(newLine, "\\n");
    }

    let tab = /\t/g;
    return str.replace(tab, "\\t");
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
    const pattern = /\%22/g;
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

    let value;
    for (var prop in data)
    {
        if (!data.hasOwnProperty(prop))
        {
            continue;
        }

        value = data[prop];
        if (value === null)
        {
            continue;
        }

        data[prop] = (typeof value)? prepareUrl(value, removeNewLines) : sanitize(value, removeNewLines);
    }
    return data;
};

/**
 * This will parse JSON data.
 *
 * @param {string} data
 * @return {*}
 */
export function decode(data)
{
    return (typeof data !== "undefined" && data.length > 0)? JSON.parse(data) : false;
}

/**
 * This will encode JSON data.
 *
 * @param {*} data
 * @return {string}
 */
export function encode(data)
{
    return (typeof data !== "undefined")? JSON.stringify(data) : false;
}