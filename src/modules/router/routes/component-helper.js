import { Jot } from "../../component/jot.js";
import { Builder } from "../../layout/builder.js";

/**
 * ComponentHelper
 *
 * This will create a helper to create and destroy components
 * that are added to a route.
 *
 * @class
 */
export class ComponentHelper
{
	/**
	 * This will create a component helper.
	 *
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
	 * @returns {void}
	 */
	focus(params)
	{
		if (this.setup === false)
		{
			this.create();
		}

		this.update(params);
	}

	/**
	 * This will setup the template.
	 *
	 * @protected
	 * @returns {void}
	 */
	setupTemplate()
	{
		let template = this.template;
		if (typeof template === 'string')
		{
			template = this.template = window[template];
			if (!template)
			{
				return;
			}
		}

		const type = typeof template;
		if (type === 'function')
		{
			this.initializeComponent();
		}
		else if (type === 'object')
		{
			this.initializeTemplateObject();
		}

		this.hasTemplate = true;
	}

	/**
	 * This will initialize the component.
	 *
	 * @protected
	 * @returns {void}
	 */
	initializeComponent()
	{
        this.component = new this.template({
            route: this.route,
            persist: this.persist,
            parent: this.parent
        });
    }

	/**
	 * This will initialize the template object.
	 *
	 * @protected
	 * @returns {void}
	 */
	initializeTemplateObject()
	{
        if (!this.template.isUnit)
		{
            this.template = Jot(this.template);
        }

        const comp = this.template;
        this.persist = comp.persist !== false;
        Object.assign(comp, { route: this.route, persist: this.persist, parent: this.parent });
        this.component = comp;
    }

	/**
	 * This will create the route component.
	 *
	 * @protected
	 * @returns {void}
	 */
	create()
	{
		if (!this.hasTemplate)
		{
			return false;
		}

		this.setup = true;

		let comp = this.component;
		if (!this.persist || !comp)
		{
			comp = this.component = this.template;
		}

		Builder.render(comp, this.container, this.parent);
	}

	/**
	 * This will remove the component.
	 *
	 * @returns {void}
	 */
	remove()
	{
		if (this.setup !== true)
		{
			return false;
		}

		this.setup = false;

		const component = this.component;
		if (!component)
		{
			return false;
		}

		if (typeof component.destroy === 'function')
		{
			component.destroy();
		}

		// this will remove the reference to the component if persit is false
		if (this.persist === false)
		{
			this.component = null;
		}
	}

	/**
	 * This will call the component update method and pass the params.
	 *
	 * @protected
	 * @param {object} params
	 * @returns {void}
	 */
	update(params)
	{
		const component = this.component;
		if (!component)
		{
			return false;
		}

		if (typeof component.update === 'function')
		{
			component.update(params);
		}
	}
}