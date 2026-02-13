import { Jot } from "./jot.js";

/**
 * This will create a Cloak component.
 *
 * A Cloak wraps a layout in a component that is transparent
 * to its children — they see the Cloak's parent as their
 * scope, as if the Cloak doesn't exist in the hierarchy.
 *
 * @param {*} props
 * @returns {typeof import("./component.js").Component|null}
 */
export const Cloak = (props) => Jot({ ...props, transparent: true });
