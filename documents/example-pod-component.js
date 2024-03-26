
export class ToDoApp extends Component
{
	data = data;

	onCreated()
	{

	}

	setupStates()
	{
		return {
			fullscreen: true
		};
	}

	beforeSetup()
	{

	}

	afterSetup()
	{

	}

	beforeDestroy()
	{
		console.log('after');
	}

	render()
	{
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
	self.data = data;

	self.created(() => {

	});

	self.setStates(() => {
		true
	});

	self.before(() =>
	{
		console.log('Mounted');
	});

	self.after(() =>
	{
		console.log('after');
	});

	self.destroy(() =>
	{
		console.log('after');
	});

	return () => Div([
		H1('To-Do App'),
		Form({ submit: handleSubmit }, [
			Input({ placeholder: 'Add a new item' }),
			Button({ type: 'submit' }, 'Add')
		]),
		Ul({
			for: ['items', (text, index) => Li({
				text,
				button: Button({ click: () => handleRemove(index) }, 'Remove')
			})]
		})
	])
});