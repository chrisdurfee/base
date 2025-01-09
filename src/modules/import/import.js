import { ImportWrapper } from './import-wrapper.js';

/**
 * This will import a module.
 *
 * @param {object|string} props
 * @returns {object}
 */
export const Import = (props) =>
{
    if (typeof props === 'string')
    {
        props = {
            src: props
        };
    }

    return new ImportWrapper(props);
};