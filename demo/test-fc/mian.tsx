import { useState, useEffect } from 'react';

import ReactDOM from 'react-dom/client';

function App() {
	const [num, setNum] = useState(10);
	const [count, setCount] = useState(0);
	console.log(num, 'dd');
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

// function Child() {
// 	return (
// 		<li>
// 			<span>hello123</span>
// 		</li>
// 	);
// }
// // console.log(App);
// function App() {
// 	const [num, updateNum] = useState(0);
// 	useEffect(() => {
// 		console.log('App mount');
// 		return () => {
// 			console.log('unmount app');
// 		};
// 	}, []);

// 	useEffect(() => {
// 		console.log('num change create', num);
// 		return () => {
// 			console.log('num change destroy', num);
// 		};
// 	}, [num]);

// 	return (
// 		<div onClick={() => updateNum(num + 1)}>
// 			{num === 0 ? <Child /> : 'noop'}
// 		</div>
// 	);
// }

// function Child() {
// 	useEffect(() => {
// 		console.log('Child mount');
// 		return () => console.log('Child unmount');
// 	}, []);

// 	return 'i am child';
// }
// function App() {
// 	const [num, update] = useState(100);
// 	return (
// 		<ul onClick={() => update(50)}>
// 			{new Array(num).fill(0).map((_, i) => {
// 				return <Child key={i}>{i}</Child>;
// 			})}
// 		</ul>
// 	);
// }

// function Child({ children }) {
// 	const now = performance.now();
// 	while (performance.now() - now < 4) {}
// 	return <li>{children}</li>;
// }

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
// const root = ReactDOM.createRoot();
// root.render(<App />);
// window.root = root;
