import { MovementFactory } from './movement-factory.js';

/**
 * Class representing an animation.
 */
export class Animation
{
    /**
     * Create an animation.
     * @param {HTMLElement} element - The element to animate.
     * @param {Object} settings - The settings for the animation.
     */
    constructor(element, settings)
    {
        this.element = element;

        /* this will track the animation properties being
        animated */
        this.movements = [];
        this.setupMovements(settings);
    }

    /**
     * Setup the animation with the given settings.
     * @param {Object} settings - The settings for the animation.
     */
    setup(settings)
    {
        this.setupMovements(settings);
    }

    /**
     * Add a movement to the animation.
     * @param {Object} property - The property to animate.
     */
    addMovement(property)
    {
        this.movements.push(property);
    }

    /**
     * Setup the movements for the animation.
     * @param {Object} settings - The settings for the animation.
     */
    setupMovements(settings)
    {
        let movement,
        element = this.element;

        /**
         * Add a movement to the animation with the given settings.
         * @param {Object} movementSettings - The settings for the movement.
         */
        const addMovement = (movementSettings) =>
        {
            movement = MovementFactory.create(element, movementSettings);
            this.addMovement(movement);
        };

        /* this will check if we have multiple properties to
        add or only one property */
        let property = settings.property;
        if(Array.isArray(property))
        {
            for(var i = 0, length = property.length; i < length; i++)
            {
                addMovement(property[i]);
            }
        }
        else
        {
            addMovement(settings);
        }
    }
}