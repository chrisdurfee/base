/**
 * HtmlToString
 *
 * This will render html to a string.
 *
 * @class
 */
// @ts-ignore
export class HtmlToString
{
    /**
     * This will create a node string.
     *
     * @param {string} tag
     * @returns {string}
     */
	static create(tag, attributes = {})
    {
        const attrString = Object.keys(attributes)
            .map(key => `${key}="${attributes[key]}"`)
            .join(' ');

        return `<${tag} ${attrString}>`;
    }

    /**
     * This will create a text node.
     *
     * @param {string} text
     * @returns {string}
     */
    static createText(text)
    {
        return text;
    }

    /**
     * This will create a comment node.
     *
     * @param {string} text
     * @returns {string}
     */
    static createComment(text)
    {
        return `<!-- ${text} -->`;
    }
}