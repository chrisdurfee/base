/**
		 * This will deep clone an object. 
		 * 
		 * @param {object} obj 
		 * @return {object}
		 */
		clone: function(obj)
		{
			var clone, i;
			
			if (!obj || typeof obj !== 'object') 
			{
				return obj;
			}

			if (obj.constructor === Array) 
			{
				clone = [];
				var length = obj.length; 
				for (i = 0; i < length; i++) 
				{
					clone[i] = this.clone(obj[i]);
				}
				return clone;
			}

			clone = {};
			for (i in obj) 
			{
				if (obj.hasOwnProperty(i)) 
				{
					clone[i] = this.clone(obj[i]);
				}
			}
			return clone;
		}