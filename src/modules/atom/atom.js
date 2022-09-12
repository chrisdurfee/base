import {Objects} from "../../shared/objects.js";

/**
 * Atom
 *
 * This will create an interface for atoms to
 * extend from a parent atom.
 * @class
 */
export const Atom = function()
{

};

/**
 * This will extend the atom to a child atom.
 * @static
 * @param {(object|function)}
 * @return {function} The child atom constructor.
 */
Atom.extend = function extend(childLayout)
{
	let parent = this;

	/*
	this will setup a layout function to call to standardize
	the interface for non function atoms.
	*/
	if(typeof childLayout === 'object')
	{
		let layoutObject = childLayout;
		childLayout = (props) =>
		{
			return Objects.cloneObject(layoutObject);
		};
	}

	const child = (props = {}) =>
	{
		props = props || {};
		let layout = childLayout(props),

		// we want to check to merge the layout with the parent layout
		parentLayout = parent(props);
		if(typeof parentLayout === 'object')
		{
			layout = Objects.extendObject(parentLayout, layout);
		}
		return layout;
	};

	child.extend = extend;
	return child;
};