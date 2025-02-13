import { Component } from "./component.js";
import { Jot } from "./jot.js";

/**
 * Cloak Component
 *
 * This will create a component that can accept data from a parent component
 * or it will use the parent's data or context data to set a local context
 * to act as if it's data scope is the parent component.
 *
 * @type {typeof Component}
 */
export const CloakComponent = Jot(
{
	/**
	 * This will get the child scope instance of the component.
	 *
	 * @returns {object}
	 */
	getChildScope()
	{
		return this.parent?.parent ?? this.parent;
	}
});

/**
 * This will create a Cloak component.
 *
 * @param  {*} props
 * @returns {typeof CloakComponent}
 */
export const Cloak = (props) => Jot(props, CloakComponent);
