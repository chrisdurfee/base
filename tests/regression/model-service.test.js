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

/**
 * `replaceUrl` interpolates `[[prop]]` tokens out of the model. It used to
 * borrow `WatcherHelper.isWatching` and `WatcherHelper.replaceParams` to do
 * it, which dragged the layout watcher, the html helper and the DOM data
 * binder into every bundle reaching the data entry: 5,445 raw bytes of
 * element binding to templatise a service URL.
 *
 * Two calls justified that whole subtree, so they were inlined. These pin the
 * semantics the borrowed helpers had, since a divergence here would silently
 * send requests to the wrong URL.
 */
describe('Model service url interpolation', () =>
{
	/**
	 * @param {object} values
	 * @returns {object}
	 */
	const serviceFor = (values) => new ModelService(new Model(values));

	it('substitutes a single token', () =>
	{
		expect(serviceFor({ id: 5 }).replaceUrl('/user/[[id]]')).toBe('/user/5');
	});

	it('substitutes every token in the string', () =>
	{
		const service = serviceFor({ group: 'admin', id: 7 });

		expect(service.replaceUrl('/[[group]]/user/[[id]]/edit')).toBe('/admin/user/7/edit');
	});

	it('leaves a string with no tokens alone', () =>
	{
		expect(serviceFor({ id: 5 }).replaceUrl('/user/all')).toBe('/user/all');
	});

	it('substitutes an empty string for a missing property', () =>
	{
		expect(serviceFor({ id: 5 }).replaceUrl('/user/[[missing]]/edit')).toBe('/user//edit');
	});

	it('substitutes an empty string for a null value', () =>
	{
		expect(serviceFor({ id: null }).replaceUrl('/user/[[id]]/edit')).toBe('/user//edit');
	});

	it('reads a deep path', () =>
	{
		expect(serviceFor({ user: { id: 9 } }).replaceUrl('/user/[[user.id]]')).toBe('/user/9');
	});

	it('reads an indexed path', () =>
	{
		expect(serviceFor({ ids: [3, 4] }).replaceUrl('/user/[[ids[1]]]')).toBe('/user/4');
	});

	it('drops a single trailing slash', () =>
	{
		expect(serviceFor({ id: 5 }).replaceUrl('/user/[[id]]/')).toBe('/user/5');
	});

	it('drops a trailing slash even with no token to replace', () =>
	{
		expect(serviceFor({ id: 5 }).replaceUrl('/user/all/')).toBe('/user/all');
	});

	/**
	 * A `$&` in a replacement string is a backreference to String.replace, so
	 * a value carrying one must not be re-expanded into the url.
	 */
	it('does not treat a substituted value as a replacement pattern', () =>
	{
		expect(serviceFor({ name: '$&x' }).replaceUrl('/user/[[name]]')).toBe('/user/$&x');
	});

	it('interpolates through getUrl using the model url as the base', () =>
	{
		const service = serviceFor({ id: 5 });
		service.url = '/user/[[id]]';

		expect(service.getUrl('')).toBe('/user/5');
		expect(service.getUrl('/roles')).toBe('/user/5/roles');
	});
});
