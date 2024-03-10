/**
 * This will convert a string to title case.
 *
 * @param {string} str
 * @return {string}
 */
const toTitleCase = (str) =>
{
    const pattern = /\w\S*/;
    return str.replace(pattern, (txt) =>
    {
        return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
    });
};

/**
 * This will replace any params in the string.
 *
 * @param {string} str
 * @param {object} route
 * @return {string}
 */
const replaceParams = (str, route) =>
{
    if (str.indexOf(':') === -1)
    {
        return str;
    }

    const params = route.stage;
    for (const [key, value] of Object.entries(params))
    {
        const pattern = new RegExp(':' + key, 'gi');
        str = str.replace(pattern, value);
    }

    return str;
};

/**
 * This will set the title.
 *
 * @param {object} route
 * @param {*} title
 * @param {string} rootTitle
 * @return {string}
 */
export const setTitle = (route, title, rootTitle) =>
{
    if (!title)
    {
        return title;
    }

    if (typeof title === 'function')
    {
        title = title(route.stage);
    }

    /* we want to replace any params in the title
    and uppercase the title */
    title = replaceParams(title, route);
    title = toTitleCase(title);

    /* we want to check to add the base title to the
    to the end of the title */
    if (rootTitle !== '')
    {
        title += " - " + rootTitle;
    }
    return title;
};