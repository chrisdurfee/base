
export class ToDoApp extends Component
{
	onCreated()
	{
		console.log('created');
		this.data = new Data({ items: [] });
	}

	setupStates()
	{
		return {
			loaded: true
		};
	}

	beforeSetup()
	{
		console.log('before');
	}

	afterSetup()
	{
		console.log('after');
	}

	beforeDestroy()
	{
		console.log('destroy');
	}

	render()
	{
		// handle form submission
		const handleSubmit = (event, { data }) =>
		{
			event.preventDefault();
			const form = event.target;
			const input = form.querySelector('input');

			// add the new to-do item to the array of items
			data.push('items', input.value);
			input.value = '';
		};

		// handle item removal
		const handleRemove = (index, data) => data.splice('items', index);

		return Div([
			H1('To-Do App'),
			Form({ submit: handleSubmit }, [
				Input({ placeholder: 'Add a new item' }),
				Button({ type: 'submit' }, 'Add')
			]),
			Ul({
				for: [self.data, 'items', (text, index) => Li({
					text,
					button: Button({ click: () => handleRemove(index) }, 'Remove')
				})]
			})
		])
	}
}


// Jot, Box, Pane, View, Cell, Pod
export const PodToDoApp = Pod((self) =>
{
	self.created = () =>
    {
        console.log('created');
	};

    self.setData = () => new Data({ items: [] });

	self.setStates = () => ({
		loaded: true
	});

	self.before = () =>
	{
		console.log('before');
	};

	self.after = () =>
	{
		console.log('after');
	};

	self.destroy = () =>
	{
		console.log('destroy');
	};

    // handle form submission
    const handleSubmit = (event, { data }) =>
    {
        event.preventDefault();
        const form = event.target;
        const input = form.querySelector('input');

        // add the new to-do item to the array of items
        data.push('items', input.value);
        input.value = '';
    };

    // handle item removal
    const handleRemove = (index, data) => data.splice('items', index);

	return () => Div([
        H1('To-Do App'),
        Form({ submit: handleSubmit }, [
            Input({ placeholder: 'Add a new item' }),
            Button({ type: 'submit' }, 'Add')
        ]),
        Ul({
            for: ['items', (text, index) => Li({
                text,
                button: Button({ click: (e, { data }) => handleRemove(index, data) }, 'Remove')
            })]
        })
    ])
});