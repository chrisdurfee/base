/**
 * Module augmentation for BasicData and its subclasses.
 *
 * BasicData (and its subclasses Data, SimpleData, Model) use a DataProxy
 * that allows dynamic property access on instances (e.g. `data.myProp`).
 * This augmentation tells TypeScript that arbitrary properties are allowed
 * on all data instances.
 */
import { BasicData } from './basic-data.js';

declare module './basic-data.js' {
    interface BasicData {
        [key: string]: any;
    }
}
