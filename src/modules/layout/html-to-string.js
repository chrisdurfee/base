/**
 * Set-based self-closing tag lookup for O(1) checks
 * instead of Array.includes() linear scan.
 *
 * @type {Set<string>}
 */
const SELF_CLOSING_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source']);

/**
 * Pre-compiled pattern that checks if escaping is needed
 * before paying the cost of multiple replace calls.
 *
 * @type {RegExp}
 */
const ESCAPE_TEST = /[&<>"]/;

/**
 * This will escape a value for safe use in html
 * text content and attribute values.
 *
 * @param {*} value
 * @returns {string}
 */
const escapeHtml = (value) =>
{
	const str = (typeof value === 'string')? value : String(value);
	if (!ESCAPE_TEST.test(str))
	{
		return str;
	}

	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
};

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
                innerContent += escapeHtml(value);
                continue;
            }

            if (key === 'html' || key === 'innerHTML')
            {
                /* html is developer opt-in raw content and
                is intentionally not escaped */
                innerContent += value;
                continue;
            }

            /* event handlers are client-side only and should
            never be serialized into the markup */
            if (typeof value === 'function')
            {
                continue;
            }

            const attr = key + '="' + escapeHtml(value) + '"';
            if (attrString)
            {
                attrString += ' ' + attr;
            }
            else
            {
                attrString = attr;
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
        return escapeHtml(text);
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