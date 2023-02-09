import { useState } from 'react';

import ReactDOM from 'react-dom';

function App() {
	const [num, setNum] = useState(10);
	return (
		<div onClickCapture={() => setNum(num + 1)}>
			{num}
			<p>123</p>
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
