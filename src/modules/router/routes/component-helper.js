import { Cloak } from "../../component/cloak.js";
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
	 * @param {object} routeProxy
	 * @param {object} settings
	 */
	constructor(routeProxy, settings)
	{
		this.route = routeProxy;

		this.template = settings.component;
		this.component = null;
		this.hasTemplate = false;

		this.setup = false;
		this.container = settings.container;
		this.persist = settings.persist;
		this.parent = settings.parent;
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
		const template = this.template;
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
	 * This will initialize the component by calling the function
	 * that should return a new instance of a component.
	 *
	 * @protected
	 * @returns {void}
	 */
	initializeComponent()
	{
		const comp = this.template();
        this.transferSettings(comp);
    }

	/**
	 * This will transfer the settings to the component.
	 *
	 * @param {object} comp
	 * @returns {void}
	 */
	transferSettings(comp)
	{
		this.persist = (this.persist && comp.persist !== false);
        Object.assign(comp, { route: this.route, persist: this.persist });
		this.component = comp;
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
            this.template = new (Cloak(this.template));
        }

        const comp = this.template;
        this.transferSettings(comp);
    }

	/**
	 * This will create the route component.
	 *
	 * @protected
	 * @returns {void}
	 */
	create()
	{
		this.setupTemplate();

		if (!this.hasTemplate)
		{
			return;
		}

		this.setup = true;
		const comp = this.component;
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
			return;
		}

		this.setup = false;

		const component = this.component;
		if (!component)
		{
			return;
		}

		if (typeof component.destroy === 'function')
		{
			component.destroy();
		}

		this.component = null;
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
			return;
		}

		if (typeof component.update === 'function')
		{
			component.update(params);
		}
	}
}