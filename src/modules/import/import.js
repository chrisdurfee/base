import { ImportWrapper } from './import-wrapper.js';

/**
 * This will import a module.
 *
 * @param {object|string} props
 * @returns {object}
 */
export const Import = (props) =>
{
    const type = typeof props;
    if (type === 'string' || type === 'function')
    {
        props = {
            src: props
        };
    }

    return new ImportWrapper(props);
};