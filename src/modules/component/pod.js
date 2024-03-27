import { Component } from './component.js';

/**
 * Pods
 *
 * Pods are components that are created using a shorthand method.
 *
 * @author Chris Durfee
 * @author Cayon Christiansen
 */
const getDefaultMethods = () => (
{
    created() {},
    setData() {
        return null;
    },
    onCreated() {
        this.created();
    },

    setContext(context) {
		return null;
	},
	addContext(context) {
		return null;
	},

    setStates() {},
    setupStates () {
        return this.setStates();
    },

    events() {
        return [];
    },
    setupEvents() {
        return this.events();
    },

    before() {},
    beforeSetup() {
        this.before();
    },

    after() {},
    afterSetup() {
        this.after();
    },

    destroy() {},
    beforeDestroy() {
        this.destroy();
    }
});

/**
 * This will modify the methods to convert the shorthand
 * methods to the full methods.
 *
 * @param {object} component
 * @returns {object}
 */
const modifyMethods = (component) =>
{
    const methods = { ...getDefaultMethods(), ...component };
    Object.assign(component.prototype, methods);

    return component;
};

/**
 * This will create a class.
 *
 * @param {object} Base
 * @returns {object}
 */
const extendBaseClass = (Base) =>
{
    return class extends Base {}
};

/**
 * This will create a pod component.
 *
 * @param {function} callBack
 * @returns {object}
 */
export const Pod = (callBack) =>
{
    if (!callBack)
    {
        return null;
    }

    const component = extendBaseClass(Component);

    /**
     * This will call the callback function and pass the component
     * to set up the component.
     *
     * The result is the render method.
     */
    const render = callBack(component);

    /**
     * This will modify the methods to convert the shorthand
     * methods to the full methods.
     */
    modifyMethods(component);

    component.prototype.render = render;
    return component;
};