import { useState } from 'react';

import ReactDOM from 'react-dom';

function App() {
	const [num, setNum] = useState(10);
	const arr =
		num % 2 === 0
			? [<li key="1">1</li>, <li key="2">2</li>, <li key="3">3</li>]
			: [<li key="3">3</li>, <li key="2">2</li>, <li key="1">1</li>];

	return (
		<div>
			{num}
			<Child />
		</div>
	);
}

function Child() {
	return (
		<div>
			<span>hello123</span>
		</div>
	);
}
console.log(App);
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
