import { describe, expect, it } from 'vitest';
import { Model } from '../../src/modules/data/types/model/model.js';
import { ModelService } from '../../src/modules/data/types/model/model-service.js';

/**
 * `Model.prototype.service` moved from a `Model.prototype.service = ModelService`
 * assignment below the class body to an accessor pair inside it, because the
 * top level property mutation was a side effect no bundler could prove safe to
 * drop. It pinned `ModelService` into every bundle that imported anything from
 * the data entry, worth 15kb raw on a `Data` only consumer bundle and 22kb on a
 * `SimpleData` only one.
 *
 * The observable behaviour is supposed to be unchanged. These pin the four ways
 * the property is read and written so the accessor cannot quietly break them.
 */
describe('Model service resolution', () =>
{
	it('resolves the default service off the base prototype', () =>
	{
		expect(Model.prototype.service).toBe(ModelService);
	});

	it('gives an extended model its own service subclass', () =>
	{
		const Extended = Model.extend({ url: '/things' });

		expect(Extended.prototype.service).not.toBe(ModelService);
		expect(Object.prototype.isPrototypeOf.call(ModelService, Extended.prototype.service)).toBe(true);
	});

	it('leaves the base prototype untouched when a model is extended', () =>
	{
		Model.extend({ url: '/things' });

		expect(Model.prototype.service).toBe(ModelService);
	});

	it('extends the parent service rather than the root one when subclassing twice', () =>
	{
		const Parent = Model.extend({ url: '/parent' });
		const Child = Parent.extend({ url: '/child' });

		expect(Object.prototype.isPrototypeOf.call(Parent.prototype.service, Child.prototype.service)).toBe(true);
	});

	it('accepts a plain assignment shadowing the accessor on a subclass prototype', () =>
	{
		class Custom extends ModelService {}
		class Sub extends Model {}

		Sub.prototype.service = Custom;

		expect(Sub.prototype.service).toBe(Custom);
		expect(Model.prototype.service).toBe(ModelService);
	});

	/**
	 * Data returns a proxy from its constructor and the get trap binds
	 * functions, so an instance read cannot be compared by identity. The
	 * point here is only that assigning through the accessor does not throw
	 * and does not leak onto the shared base prototype.
	 */
	it('accepts a plain assignment on an instance without touching the base', () =>
	{
		const model = new Model();
		class Custom extends ModelService {}

		expect(() => { model.service = Custom; }).not.toThrow();
		expect(Model.prototype.service).toBe(ModelService);
	});

	it('does not throw when settings carry a service key', () =>
	{
		class Custom extends ModelService {}

		expect(() => Model.extend({ url: '/things', service: Custom })).not.toThrow();
	});
});
