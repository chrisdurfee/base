import { removeEventPrefix } from '../html/html.js';

/**
 * Set-based self-closing tag lookup for O(1) checks
 * instead of Array.includes() linear scan.
 *
 * @type {Set<string>}
 */
const SELF_CLOSING_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source']);

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
     * Single-pass over attrs array replaces the previous
     * three-pass approach (getInnerContent + getInnerHtml +
     * createAttributes), eliminating intermediate allocations
     * and the unsafe splice-during-forEach pattern.
     *
     * @param {string} tag
     * @param {Array<any>} attrs
     * @param {string} children
     * @returns {string}
     */
	static create(tag, attrs = [], children = '')
    {
        let innerContent = '';
        let attrString = '';

        for (let i = 0, len = attrs.length; i < len; i++)
        {
            const item = attrs[i];
            const key = item.key;
            const value = item.value;

            if (key === 'text' || key === 'textContent')
            {
                innerContent += value;
                continue;
            }

            if (key === 'html' || key === 'innerHTML')
            {
                innerContent += value;
                continue;
            }

            if (typeof value === 'function')
            {
                const eventName = 'on' + removeEventPrefix(key);
                if (attrString)
                {
                    attrString += ' ' + eventName + '="' + value + '"';
                }
                else
                {
                    attrString = eventName + '="' + value + '"';
                }
                continue;
            }

            if (attrString)
            {
                attrString += ' ' + key + '="' + value + '"';
            }
            else
            {
                attrString = key + '="' + value + '"';
            }
        }

        if (SELF_CLOSING_TAGS.has(tag))
        {
            return '<' + tag + ' ' + attrString + ' />';
        }

        return '<' + tag + ' ' + attrString + '>' + innerContent + children + '</' + tag + '>';
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
        return '<!-- ' + text + ' -->';
    }
}