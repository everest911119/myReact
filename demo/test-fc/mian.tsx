import { useState } from 'react';

import ReactDOM from 'react-dom';

function App() {
	const [num, setNum] = useState(10);
	const [count, setCount] = useState(0);
	console.log(num, 'dd');
	// const arr =
	// 	num % 2 === 0
	// 		? [
	// 				<li key="1">1</li>,
	// 				<li key="2">2</li>,
	// 				<li key="3">
	// 					3 <div>123</div>
	// 				</li>
	// 		  ]
	// 		: [<li key="3">3</li>, <li key="2">2</li>, <li key="3">3</li>];

	return (
		<ul
			onClick={() => {
				setNum((num) => num + 1);
				setNum((num) => num + 2);
				setNum((num) => num + 3);
				console.log(num, 'in function');
				// setCount((prev) => prev + 1);
			}}
		>
			<li>{count}</li>
			<li>{num}</li>
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
