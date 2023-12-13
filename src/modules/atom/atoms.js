import { Atom } from './atom.js';

/**
 * Creates a generic HTML tag.
 *
 * @param {object} props - Properties for the HTML element.
 * @param {array} children - Children elements of the HTML element.
 * @return {object} - Returns an object representing the HTML element.
 */
const Tag = (props, children) => {
    return { ...props, children };
};

/**
 * Creates a div element.
 *
 * @param {object} props - Properties for the div element.
 * @param {array} children - Children elements of the div.
 * @return {object} - Returns an object representing the div element.
 */
export const Div = Atom((props, children) => Tag(props, children));

/**
 * Creates a span element.
 *
 * @param {object} props - Properties for the span element.
 * @param {array} children - Children elements of the span.
 * @return {object} - Returns an object representing the span element.
 */
export const Span = Atom((props, children) => Tag({ ...props, tag: 'span' }, children));

/**
 * Creates a paragraph (p) element.
 *
 * @param {object} props - Properties for the paragraph element.
 * @param {array} children - Children elements of the paragraph.
 * @return {object} - Returns an object representing the paragraph element.
 */
export const P = Atom((props, children) => Tag({ ...props, tag: 'p' }, children));

/**
 * Creates an anchor (a) element.
 *
 * @param {object} props - Properties for the anchor element.
 * @param {array} children - Children elements of the anchor.
 * @return {object} - Returns an object representing the anchor element.
 */
export const A = Atom((props, children) => Tag({ ...props, tag: 'a' }, children));

/**
 * Creates a button element.
 */
export const Button = Atom((props, children) => Tag({ ...props, tag: 'button' }, children));

/**
 * Creates an unordered list (ul) element.
 */
export const Ul = Atom((props, children) => Tag({ ...props, tag: 'ul' }, children));

/**
 * Creates a list item (li) element.
 */
export const Li = Atom((props, children) => Tag({ ...props, tag: 'li' }, children));

/**
 * Creates an image (img) element.
 */
export const Img = Atom((props) => Tag({ ...props, tag: 'img' }, null));

/**
 * Create a br element.
 *
 * @param {object} props - Properties for the br element.
 * @return {object} - Returns an object representing the br element.
 */
export const Br = Atom((props) => Tag({ ...props, tag: 'br' }, null));

/**
 * Creates a horizontal rule (hr) element.
 */
export const Hr = Atom((props) => Tag({ ...props, tag: 'hr' }, null));

/**
 * Creates a header 1 (h1) element.
 */
export const H1 = Atom((props, children) => Tag({ ...props, tag: 'h1' }, children));

/**
 * Creates a header 2 (h2) element.
 */
export const H2 = Atom((props, children) => Tag({ ...props, tag: 'h2' }, children));

/**
 * Creates a header 3 (h3) element.
 */
export const H3 = Atom((props, children) => Tag({ ...props, tag: 'h3' }, children));

/**
 * Creates a header 4 (h4) element.
 */
export const H4 = Atom((props, children) => Tag({ ...props, tag: 'h4' }, children));

/**
 * Creates a header 5 (h5) element.
 */
export const H5 = Atom((props, children) => Tag({ ...props, tag: 'h5' }, children));

/**
 * Creates a header 6 (h6) element.
 */
export const H6 = Atom((props, children) => Tag({ ...props, tag: 'h6' }, children));

/**
 * Creates an input element.
 */
export const Input = Atom((props) => Tag({ ...props, tag: 'input' }, null));

/**
 * Creates a label element.
 */
export const Label = Atom((props, children) => Tag({ ...props, tag: 'label' }, children));

/**
 * Creates a section element.
 */
export const Section = Atom((props, children) => Tag({ ...props, tag: 'section' }, children));

/**
 * Creates an article element.
 */
export const Article = Atom((props, children) => Tag({ ...props, tag: 'article' }, children));

/**
 * Creates a header (header) element.
 */
export const Header = Atom((props, children) => Tag({ ...props, tag: 'header' }, children));

/**
 * Creates a footer element.
 */
export const Footer = Atom((props, children) => Tag({ ...props, tag: 'footer' }, children));

/**
 * Creates a nav element.
 */
export const Nav = Atom((props, children) => Tag({ ...props, tag: 'nav' }, children));

/**
 * Creates an aside element.
 */
export const Aside = Atom((props, children) => Tag({ ...props, tag: 'aside' }, children));

/**
 * Creates a figure element.
 */
export const Figure = Atom((props, children) => Tag({ ...props, tag: 'figure' }, children));

/**
 * Creates a figcaption element.
 */
export const Figcaption = Atom((props, children) => Tag({ ...props, tag: 'figcaption' }, children));

/**
 * Creates a main element.
 */
export const Main = Atom((props, children) => Tag({ ...props, tag: 'main' }, children));

/**
 * Creates a video element.
 */
export const Video = Atom((props, children) => Tag({ ...props, tag: 'video' }, children));

/**
 * Creates an audio element.
 */
export const Audio = Atom((props, children) => Tag({ ...props, tag: 'audio' }, children));

/**
 * Creates a table element.
 */
export const Table = Atom((props, children) => Tag({ ...props, tag: 'table' }, children));

/**
 * Creates a table row (tr) element.
 */
export const Tr = Atom((props, children) => Tag({ ...props, tag: 'tr' }, children));

/**
 * Creates a table header (th) element.
 */
export const Th = Atom((props, children) => Tag({ ...props, tag: 'th' }, children));

/**
 * Creates a table data (td) element.
 */
export const Td = Atom((props, children) => Tag({ ...props, tag: 'td' }, children));

/**
 * Creates a table header group (thead) element.
 */
export const Thead = Atom((props, children) => Tag({ ...props, tag: 'thead' }, children));

/**
 * Creates a table body (tbody) element.
 */
export const Tbody = Atom((props, children) => Tag({ ...props, tag: 'tbody' }, children));

/**
 * Creates a table footer (tfoot) element.
 */
export const Tfoot = Atom((props, children) => Tag({ ...props, tag: 'tfoot' }, children));

/**
 * Creates a form element.
 */
export const Form = Atom((props, children) => Tag({ ...props, tag: 'form' }, children));

/**
 * Creates a select element.
 */
export const Select = Atom((props, children) => Tag({ ...props, tag: 'select' }, children));

/**
 * Creates an option element for a select tag.
 */
export const Option = Atom((props, children) => Tag({ ...props, tag: 'option' }, children));

/**
 * Creates a textarea element.
 */
export const Textarea = Atom((props, children) => Tag({ ...props, tag: 'textarea' }, children));

/**
 * Creates a canvas element.
 */
export const Canvas = Atom((props, children) => Tag({ ...props, tag: 'canvas' }, children));

/**
 * Creates a progress element.
 */
export const Progress = Atom((props, children) => Tag({ ...props, tag: 'progress' }, children));

/**
 * Creates a blockquote element.
 */
export const Blockquote = Atom((props, children) => Tag({ ...props, tag: 'blockquote' }, children));

/**
 * Creates a preformatted text (pre) element.
 */
export const Pre = Atom((props, children) => Tag({ ...props, tag: 'pre' }, children));

/**
 * Creates a code element.
 */
export const Code = Atom((props, children) => Tag({ ...props, tag: 'code' }, children));

/**
 * Creates an ordered list (ol) element.
 */
export const Ol = Atom((props, children) => Tag({ ...props, tag: 'ol' }, children));

/**
 * Creates a definition list (dl) element.
 */
export const Dl = Atom((props, children) => Tag({ ...props, tag: 'dl' }, children));

/**
 * Creates a definition term (dt) element.
 */
export const Dt = Atom((props, children) => Tag({ ...props, tag: 'dt' }, children));

/**
 * Creates a definition description (dd) element.
 */
export const Dd = Atom((props, children) => Tag({ ...props, tag: 'dd' }, children));

/**
 * Creates a fieldset element.
 */
export const Fieldset = Atom((props, children) => Tag({ ...props, tag: 'fieldset' }, children));

/**
 * Creates a legend element.
 */
export const Legend = Atom((props, children) => Tag({ ...props, tag: 'legend' }, children));

/**
 * Creates a meter element.
 */
export const Meter = Atom((props, children) => Tag({ ...props, tag: 'meter' }, children));

/**
 * Creates an iframe element.
 */
export const Iframe = Atom((props, children) => Tag({ ...props, tag: 'iframe' }, children));

/**
 * Creates a details element.
 */
export const Details = Atom((props, children) => Tag({ ...props, tag: 'details' }, children));

/**
 * Creates a summary element.
 */
export const Summary = Atom((props, children) => Tag({ ...props, tag: 'summary' }, children));

/**
 * Creates an em element.
 */
export const Em = Atom((props, children) => Tag({ ...props, tag: 'em' }, children));

/**
 * Creates a strong element.
 */
export const Strong = Atom((props, children) => Tag({ ...props, tag: 'strong' }, children));

/**
 * Creates a small element.
 */
export const Small = Atom((props, children) => Tag({ ...props, tag: 'small' }, children));

/**
 * Creates a s element (strikethrough).
 */
export const S = Atom((props, children) => Tag({ ...props, tag: 's' }, children));

/**
 * Creates a cite element.
 */
export const Cite = Atom((props, children) => Tag({ ...props, tag: 'cite' }, children));

/**
 * Creates a q element (inline quotation).
 */
export const Q = Atom((props, children) => Tag({ ...props, tag: 'q' }, children));

/**
 * Creates a dfn element (definition element).
 */
export const Dfn = Atom((props, children) => Tag({ ...props, tag: 'dfn' }, children));

/**
 * Creates an abbr element (abbreviation).
 */
export const Abbr = Atom((props, children) => Tag({ ...props, tag: 'abbr' }, children));

/**
 * Creates a data element.
 */
export const Data = Atom((props, children) => Tag({ ...props, tag: 'data' }, children));

/**
 * Creates a time element.
 */
export const Time = Atom((props, children) => Tag({ ...props, tag: 'time' }, children));

/**
 * Creates a var element (variable).
 */
export const Var = Atom((props, children) => Tag({ ...props, tag: 'var' }, children));

/**
 * Creates a samp element (sample output).
 */
export const Samp = Atom((props, children) => Tag({ ...props, tag: 'samp' }, children));

/**
 * Creates a kbd element (keyboard input).
 */
export const Kbd = Atom((props, children) => Tag({ ...props, tag: 'kbd' }, children));

/**
 * Creates a sub element (subscript).
 */
export const Sub = Atom((props, children) => Tag({ ...props, tag: 'sub' }, children));

/**
 * Creates a sup element (superscript).
 */
export const Sup = Atom((props, children) => Tag({ ...props, tag: 'sup' }, children));

/**
 * Creates an i element (italic).
 */
export const I = Atom((props, children) => Tag({ ...props, tag: 'i' }, children));

/**
 * Creates a b element (bold).
 */
export const B = Atom((props, children) => Tag({ ...props, tag: 'b' }, children));

/**
 * Creates a u element (underline).
 */
export const U = Atom((props, children) => Tag({ ...props, tag: 'u' }, children));

/**
 * Creates a mark element.
 */
export const Mark = Atom((props, children) => Tag({ ...props, tag: 'mark' }, children));

/**
 * Creates a ruby element (for East Asian typography).
 */
export const Ruby = Atom((props, children) => Tag({ ...props, tag: 'ruby' }, children));

/**
 * Creates an rt element (explanation/pronunciation of characters in East Asian typography).
 */
export const Rt = Atom((props, children) => Tag({ ...props, tag: 'rt' }, children));

/**
 * Creates an rp element (for East Asian fallback parenthesis).
 */
export const Rp = Atom((props, children) => Tag({ ...props, tag: 'rp' }, children));

/**
 * Creates a bdi element (Bi-Directional Isolation).
 */
export const Bdi = Atom((props, children) => Tag({ ...props, tag: 'bdi' }, children));

/**
 * Creates a bdo element (Bi-Directional Override).
 */
export const Bdo = Atom((props, children) => Tag({ ...props, tag: 'bdo' }, children));

/**
 * Creates a wbr element (Word Break Opportunity).
 */
export const Wbr = Atom((props) => Tag({ ...props, tag: 'wbr' }, null));