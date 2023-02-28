import './style.css';
const button = document.querySelector('button');
const root = document.querySelector('#root');
interface Work {
	// 某一个工作要执行的次数， react中组件的数量组件render的数量
	count: number;
}

import {
	unstable_ImmediatePriority,
	unstable_UserBlockingPriority
} from 'scheduler';
const workList: Work[] = [];
function schedule() {
	const curWork = workList.pop();
	if (curWork) {
		perform(curWork);
	}
}

function perform(work: Work) {
	while (work.count) {
		work.count--;
		insertSpan('0');
	}
	schedule();
}

function insertSpan(content) {
	const span = document.createElement('span');
	span.innerText = content;
	root?.appendChild(span);
}

button &&
	(button.onclick = () => {
		workList.unshift({ count: 100 });
		schedule();
	});
