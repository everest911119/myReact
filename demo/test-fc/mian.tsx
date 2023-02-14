import { useState } from 'react';

import ReactDOM from 'react-dom';

function App() {
	const [num, setNum] = useState(10);
	const arr =
		num % 2 === 0
			? [
					<li key="1">1</li>,
					<li key="2">2</li>,
					<li key="3">
						3 <div>123</div>
					</li>
			  ]
			: [<li key="3">3</li>, <li key="2">2</li>, <li key="3">3</li>];

	return (
		<ul onClick={() => setNum(num + 1)}>
			<li>hello</li>
			{num % 2 === 0 ? (
				<>
					<li key="1">1</li>
					<li key="2">2</li>
					<li key="3">
						3 <div>12qqwqw</div>
					</li>
				</>
			) : (
				<>
					<li key="1">1</li>
					<Child />
					<li key="2">2</li>
				</>
			)}
		</ul>
	);
}

function Child() {
	return (
		<li>
			<span>hello123</span>
		</li>
	);
}
console.log(App);
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
