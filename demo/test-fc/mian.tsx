import { useState } from 'react';

import ReactDOM from 'react-dom';

function App() {
	const [num, setNum] = useState(10);
	window.setNum = setNum;
	return num >= 3 ? <div>{num}</div> : <Child />;
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
