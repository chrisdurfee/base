/**
 * DataPubSub
 * 
 * This is a pub sub class to allow subscribers to 
 * listen for updates when published by publishers. 
 * @class 
 */
export class DataPubSub
{ 
	/**
	 * @constructor
	 */
	constructor()
	{ 
		/**
		 * @member {object} callBacks
		 * @protected
		 */
		this.callBacks = {}; 
		
		/**
		 * @member {int} lastToken
		 * @protected
		 */
		this.lastToken = -1; 
	} 

	/**
	 * This will get a subscriber array. 
	 * 
	 * @param {string} msg 
	 * @return {array}
	 */
	get(msg) 
	{ 
		let callBacks = this.callBacks;
		return (callBacks[msg] || (callBacks[msg] = []));
	}

	/**
	 * This will reset pub sub. 
	 */
	reset() 
	{ 
		this.callBacks = {}; 
		this.lastToken = -1;
	} 

	/**
	 * This will add a subscriber. 
	 * 
	 * @param {string} msg 
	 * @param {function} callBack 
	 * @return {string} The subscriber token. 
	 */
	on(msg, callBack) 
	{ 
		let token = (++this.lastToken),
		list = this.get(msg);
		list.push({
			token: token, 
			callBack: callBack
		});
		return token; 
	} 
	
	/**
	 * This will remove a subscriber. 
	 * 
	 * @param {string} msg 
	 * @param {string} token 
	 */
	off(msg, token) 
	{ 
		let list = this.callBacks[msg] || false;
		if(list === false)
		{
			return false; 
		}
		
		let length = list.length; 
		for (var i = 0; i < length; i++ ) 
		{
			var item = list[i]; 
			if(item.token === token)
			{
				list.splice(i, 1);
				break;
			}
		}
	} 
	
	/**
	 * This will delete a message. 
	 * 
	 * @param {string} msg 
	 */
	remove(msg) 
	{ 
		let callBacks = this.callBacks; 
		if(callBacks[msg])
		{ 
			delete callBacks[msg]; 
		}
	} 
	
	/**
	 * This will publish a message. 
	 * 
	 * @param {string} msg 
	 * @param {string} value
	 * @param {object} committer
	 */
	publish(msg) 
	{ 
		let i, length,
		list = this.callBacks[msg] || false; 
		if(list === false)
		{ 
			return false; 
		}
		
		let args = Array.prototype.slice.call(arguments, 1);
		
		length = list.length;
		for (i = 0; i < length; i++) 
		{
			var item = list[i]; 
			if(!item)
			{
				continue; 
			}
			item.callBack.apply(this, args);
		}
	}
}

export const pubSub = new DataPubSub();