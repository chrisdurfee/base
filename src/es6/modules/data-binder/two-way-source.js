import {Source} from './source.js';
import {pubSub} from './data-pub-sub.js';

/**
 * TwoWaySource 
 * 
 * This will create a two way source to use with 
 * a connection. 
 * @class
 * @augments Source
 */
export class TwoWaySource extends Source
{
	/**
	 * This will subscribe to a message.
	 * 
	 * @param {string} msg 
	 */
	subscribe(msg)
	{
		this.msg = msg; 
		let callBack = this.callBack.bind(this); 
		this.token = pubSub.on(msg, callBack); 
	} 
	
	/**
	 * This will unsubscribe from a message. 
	 */
	unsubscribe()
	{
		pubSub.off(this.msg, this.token); 
	}

	/**
	 * Override this to setup cource callBack. 
	 */
	callBack()
	{

	}
}