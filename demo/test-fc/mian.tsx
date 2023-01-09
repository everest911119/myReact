import { useState } from 'react';

import ReactDOM from 'react-dom';

function App() {
	const [num] = useState(10);
	return <div>{num}</div>;
}

// function Child() {
// 	return (
// 		<div>
// 			<span>hello123</span>
// 		</div>
// 	);
// }
console.log(App);
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
