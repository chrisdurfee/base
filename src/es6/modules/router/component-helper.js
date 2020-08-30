/**
 * ComponentHelper
 *
 * This will create a helper to create and destroy components
 * that are added to a route.
 * @class
 */
export class ComponentHelper
{
	/**
	 * @constructor
	 * @param {object} route
	 * @param {object} settings
	 */
	constructor(route, settings)
	{
		this.route = route;

		this.template = settings.component;
		this.component = null;
		this.hasTemplate = false;

		this.setup = false;
		this.container = settings.container;
		this.persist = settings.persist;
		this.parent = settings.parent;

		this.setupTemplate();
	}

	/**
	 * This will create the component.
	 *
	 * @param {object} params
	 */
	focus(params)
	{
		if(this.setup === false)
		{
			this.create();
		}

		this.update(params);
	}

	/**
	 * This will setup the template.
	 * @protected
	 */
	setupTemplate()
	{
		let template = this.template;
		if(typeof template === 'string')
		{
			template = this.template = window[template];
		}

		let type = typeof template;
		if(type === 'function' || type === 'object')
		{
			if(type === 'object')
			{
				let comp = this.component = this.template;
				let persist = (comp.persist !== false);

				comp.route = this.route;
				comp.persist = persist;
				comp.parent = this.parent;
				this.persist = persist;
			}

			this.hasTemplate = true;
		}
	}

	/**
	 * This will create the route component.
	 * @protected
	 */
	create()
	{
		if(!this.hasTemplate)
		{
			return false;
		}

		this.setup = true;

		let comp = this.component;
		if(!this.persist || !comp)
		{
			comp = this.component = new this.template({
				route: this.route,
				persist: this.persist,
				parent: this.parent
			});
		}

		comp.setup(this.container);
	}

	/**
	 * This will remove the component.
	 */
	remove()
	{
		if(this.setup !== true)
		{
			return false;
		}

		this.setup = false;

		let component = this.component;
		if(!component)
		{
			return false;
		}

		if(typeof component.destroy === 'function')
		{
			component.destroy();
		}

		// this will remove the reference to the component if persit is false
		if(this.persist === false)
		{
			this.component = null;
		}
	}

	/**
	 * This will call the component update method and pass the params.
	 *
	 * @protected
	 * @param {object} params
	 */
	update(params)
	{
		let component = this.component;
		if(!component)
		{
			return false;
		}

		if(typeof component.update === 'function')
		{
			component.update(params);
		}
	}
}