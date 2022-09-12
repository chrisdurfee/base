/* base framework module */
/*
	this will create dynamic html to be
	added and modified
*/
(function(global)
{
	"use strict";

	/**
	 * Atom
	 *
	 * This will create an interface for atoms to
	 * extend from a parent atom.
	 * @class
	 */
    var Atom = function()
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
		var parent = this;

		/*
		this will setup a layout function to call to standardize
		the interface for non function atoms.
		*/
		if(typeof childLayout === 'object')
		{
			var layoutObject = childLayout;
			childLayout = function(props)
			{
				return base.cloneObject(layoutObject);
			};
		}

		var child = function(props)
		{
			props = props || {};
			var layout = childLayout(props);

			// we want to check to merge the layout with the parent layout
			var parentLayout = parent(props);
			if(typeof parentLayout === 'object')
			{
				layout = base.extendObject(parentLayout, layout);
			}
			return layout;
		};

		child.extend = extend;
		return child;
	};

	global.Atom = Atom;

})(this);