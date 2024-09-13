import { removeEventPrefix } from '../html/html.js';

const selfClosingTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source'];

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
     * @param {object} attrs
     * @param {string} children
     * @returns {string}
     */
	static create(tag, attrs = {}, children = '')
    {
        const attrString = this.createAttributes(attrs);

        if (selfClosingTags.includes(tag))
        {
            return `<${tag} ${attrString} />`;
        }

        return `<${tag} ${attrString}>` + children + `</${tag}>`;
    }

    /**
     * This will create a text node.
     *
     * @param {array} attrs
     * @returns {string}
     */
    static createAttributes(attrs = [])
    {
        if (!attrs || attrs.length < 1)
        {
            return '';
        }

        return attrs
            .map(attr => {
                let { key, value } = attr;

                if (typeof value === 'function')
                {
                    key = 'on' + removeEventPrefix(key);
                }
                return `${key}="${value}"`;
            })
            .join(' ');
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