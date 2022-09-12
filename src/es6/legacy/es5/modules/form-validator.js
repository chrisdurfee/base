/* base framework module */
/*
	this will create dynamic html to be
	added and modified
*/
(function()
{
	"use strict";

	base.extend.formValidator =
	{
		/* these are the classes that will display on
		the field when validated */
		errorClass: 'error-val',
		acceptedClass: 'success-val',

		/* this will return true or false if an
		email has valid email syntax.
		@param (string) email = the email address
		to validate */
		isValidEmail: function(email)
		{
			var regExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			return regExp.test(email);
		},

		/* this will return true or false if a
		phone is the filled out.
		@param (mixed) phone = the phone number
		to validate */
		isValidPhone: function(phone)
		{
			var pattern = /[^0-9]/g;
			/* we want to convert to string and remove any marks */
			phone = phone.toString().replace(pattern, '');

			/* we want to check if the phone is a
			number */
			if(isNaN(phone))
			{
				return false;
			}

			/* we want to check to remove the leading 1 */
			if(phone.substring(0, 1) === '1')
			{
				phone = phone.substring(1);
			}

			/* we want check the length and block any 555
			area code numbers */
			return (phone.length === 10 && phone.substring(0, 3) !== '555');
		},

		/* this will return true or false if a
		date is the filled out.
		@param (string) date = the date
		to validate */
		isValidDate: function(date)
		{
			if(typeof date === 'undefined')
			{
				return false;
			}

			var result = new Date(date).toDateString();
			return (result !== 'Invalid Date');
		},

		/* this will return true or false if an
		radio group is checked.
		@param (string) groupName = the radio
		group name */
		isRadioChecked: function(groupName)
		{
			if(typeof groupName === 'undefined')
			{
				return false;
			}

			var radios = document.getElementsByName(groupName);
			if(radios && radios.length)
			{
				for(var i = 0, maxLength = radios.length; i < maxLength; i++)
				{
					var radio = radios[i];
					if(radio.type === 'radio' && radio.checked)
					{
						return true;
					}
				}
			}
			return false;
		},

		/* this will return true or false if a field
		has a value.
		@param (mixed) val = the value to validate */
		isValidField: function(val)
		{
			if(typeof val !== 'undefined' && val != '')
			{
				return true;
			}
			return false;
		},

		/* this will validate a form and return an error object
		with the number of errors and an error message.
		@param (object) form = the form to validate
		@param [(string)] uniqueFormId = specify any unique prefix that
		should be remove from the error message
		@return (object) a response object with the error
		number and message */
		validateForm: function(form, uniqueFormId)
		{
			uniqueFormId = uniqueFormId || '';
			/* we want to save a reference of our object
			to use with any call backs */
			var self = this;

			/* this will save the errors and the error message */
			var errors =
			{
				number: 0,
				message: ''
			};

			/* this will update add a field to the error object
			@param (object) node = the node element object */
			var updateError = function(node)
			{
				/* this will uppercase each word */
				var upperCaseWords = function(str)
				{
					var pattern = /\w\S*/g;
					return str.replace(pattern, function(txt){return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();});
				};

				/* we want to get something to identify the field */
				var fieldName = base.attr(node, 'placeholder') || base.attr(node, 'name') || base.attr(node, 'id');
				if(fieldName)
				{
					if(uniqueFormId !== '')
					{
						fieldName = fieldName.replace(uniqueFormId, '');
					}
					var pattern = /[^a-zA-Z1-9]/g;
					fieldName = fieldName.replace(pattern, ' ');
					fieldName = upperCaseWords(fieldName);
				}
				/* we want to increase the error count
				and save an error message for the field */
				errors.number++;
				errors.message += "<br>" + fieldName + " is empty or invaid.";
			};

			if(typeof form === 'object')
			{
				/* we want to track a radio so we do keep tracking
				the same group after the first check */
				var previousRadios = [];

				var nodes = base.find(form, 'input.val, select.val, textarea.val');
				if(nodes)
				{
					for(var i = 0, maxLength = nodes.length; i < maxLength; i++)
					{
						/* we want to cache the object and settings */
						var node = nodes[i],
						nodeName = node.nodeName.toLowerCase();

						/* we want to check if the input is a radio */
						if(nodeName === 'input' && base.attr(node, 'type') === 'radio')
						{
							var groupName = node.name;

							/* we want to check if the radio has already
							been checked */
							if(base.inArray(previousRadios, groupName) == '-1')
							{
								/* we want to add this group to the previous
								radio array to stop future checks */
								previousRadios.push(groupName);

								/* we want to validate the field and check
								the status */
								var validField = self.isRadioChecked(groupName);
								if(validField == false)
								{
									 updateError(node);
								}
							}
						}
						else
						{
							/* we want to validate the field and check
							the status */
							var validField = self.validateField(node);
							if(validField == false)
							{
								 updateError(node);
							}
						}
					}
				}
			}

			return errors;
		},

		/* this will set a field to show a validated style
		after the field is validated.
		@param (object) field = the field object
		@param (bool) isValid = set true if the field is valid */
		showValidateStyle: function(field, isValid)
		{
			/* we want to check if the field was valid */
			if(isValid == true)
			{
				/* we want to update the class to reflect the
				valid status */
				base.removeClass(field, this.errorClass);
				base.addClass(field, this.acceptedClass);
				return true;
			}
			else
			{
				/* we want to show the field is invalid
				and save */
				base.addClass(field, this.errorClass);
				base.removeClass(field, this.acceptedClass);

				return false;
			}
		},

		/* this will validate a field and return true or false.
		@param (object) field = the field element */
		validateField: function(field)
		{
			var returnValue = false;

			if(!field)
			{
				return returnValue;
			}

			var val = field.value,
			type = base.attr(field, 'type'),
			placeholder = base.attr(field, 'placeholder') || base.attr(field, 'alt');

			if(type === 'checkbox')
			{
				var validField = field.checked;
				returnValue = this.showValidateStyle(field, validField);
			}
			else if(!this.isValidField(val) || val === placeholder)
			{
				/* if the field is empty or has  same value as the
				placeholder text we can set the style to error */
				returnValue = this.showValidateStyle(field, false);
			}
			else if(type === 'email')
			{
				/* we need to validate the email */
				var validField = this.isValidEmail(val);
				returnValue = this.showValidateStyle(field, validField);

			}
			else if(type === 'tel')
			{
				/* we need to validate the phone */
				var validField = this.isValidPhone(val);
				returnValue = this.showValidateStyle(field, validField);
			}
			else if(type === 'date')
			{
				/* we need to validate the phone */
				var validField = this.isValidDate(val);
				returnValue = this.showValidateStyle(field, validField);
			}
			else
			{
				returnValue = this.showValidateStyle(field, true);
			}

			return returnValue;
		},

		/* this will remove all the validation styles from a form
		@param (object) form = the form element */
		resetForm: function(form)
		{
			if(!form || typeof form === 'object')
			{
				return false;
			}

			var elements = form.elements;
			if(elements)
			{
				for(var i = 0, maxLength = elements.length; i < maxLength; i++)
				{
					 var element = elements[i];
					 this.removeStyles(element);
				}
			}
		},

		/* this will remove the styles from a field
		@param (object) field = the element object */
		removeStyles: function(field)
		{
			if(field)
			{
				base.removeClass(field, this.errorClass);
				base.removeClass(field, this.acceptedClass);
			}
		}

	};

})();