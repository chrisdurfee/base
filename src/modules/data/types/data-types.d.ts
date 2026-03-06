/**
 * Module augmentation for BasicData and its subclasses.
 *
 * BasicData (and its subclasses Data, SimpleData, Model) use a DataProxy
 * that allows dynamic property access on instances (e.g. `data.myProp`).
 * This augmentation tells TypeScript that arbitrary properties are allowed
 * on all data instances.
 *
 * ModelClass is exported from model.js for use as a parameter type when
 * receiving a model created via Model.extend(). It combines the instance
 * interface of Model (so data.get(), data.set(), etc. are accessible) with
 * a construct signature (so `new VehicleTaxonomyModel()` remains valid).
 */

export { };

declare module './basic-data.js' {
    interface BasicData {
        [key: string]: any;
    }
}
