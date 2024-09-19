/**
 * This will convert a string to title case.
 *
 * @param {string} str
 * @returns {string}
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
 * @returns {string}
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
 * This will create a title.
 *
 * @param {object} route
 * @param {*} title
 * @returns {string}
 */
const createTitle = (route, title) =>
{
    if (!title)
    {
        return title;
    }

    if (typeof title === 'function')
    {
        title = title(route.stage);
    }

    title = replaceParams(title, route);
    return toTitleCase(title);
};

/**
 * This will add the root title to the title.
 *
 * @param {string} title
 * @param {string} rootTitle
 * @returns {string}
 */
const addRootTitle = (title, rootTitle) =>
{
    if (rootTitle !== '')
    {
        title += " - " + rootTitle;
    }
    return title;
};

/**
 * This will set the title.
 *
 * @param {object} route
 * @param {*} title
 * @param {string} rootTitle
 * @returns {string}
 */
export const setTitle = (route, title, rootTitle) =>
{
    if (!title)
    {
        return title;
    }

    title = createTitle(route, title);
    return addRootTitle(title, rootTitle);
};