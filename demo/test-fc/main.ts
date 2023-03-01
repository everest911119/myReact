import './style.css';
const button = document.querySelector('button');
const root = document.querySelector('#root');

import {
	unstable_ImmediatePriority as ImmediatePriority,
	unstable_UserBlockingPriority as UserBlockingPriority,
	unstable_NormalPriority as NormalPriority,
	unstable_IdlePriority as IdlePriority,
	unstable_LowPriority as LowPriority,
	unstable_scheduleCallback as scheduleCallback,
	CallbackNode,
	// 时间切片是否用尽
	unstable_shouldYield as shouldYield,
	unstable_getFirstCallbackNode as getFirstCallback,
	unstable_cancelCallback as cancelCallback
} from 'scheduler';

type Priority =
	| typeof IdlePriority
	| typeof LowPriority
	| typeof LowPriority
	| typeof NormalPriority
	| typeof UserBlockingPriority
	| typeof ImmediatePriority;
interface Work {
	// 某一个工作要执行的次数， react中组件的数量组件render的数量
	count: number;
	priority: Priority;
}
const workList: Work[] = [];
let prevPriority: Priority = IdlePriority;
let curCallback: CallbackNode | null = null;
[LowPriority, NormalPriority, UserBlockingPriority, ImmediatePriority].forEach(
	(item) => {
		const btn = document.createElement('button');
		root?.appendChild(btn);
		btn.innerText = [
			'',
			'ImmediatePriority',
			'UserBlockingPriority',
			'NormalPriority',
			'LowPriority'
		][item];
		btn.onclick = () => {
			workList.unshift({
				count: 100,
				priority: item as Priority
			});
			schedule();
		};
	}
);
function schedule() {
	// 取得当前调度的回调
	const cbNode = getFirstCallback();
	const curWork = workList.sort((w1, w2) => w1.priority - w2.priority)[0];
	// 策略逻辑

	if (!curWork) {
		// 如果没有work 取消调度
		curCallback = null;
		cbNode && cancelCallback(cbNode);
		return;
	}
	const { priority: curPriority } = curWork;
	if (curPriority === prevPriority) {
		return;
	}
	// 本次调度的优先级比当前的优先级高 更高优先级的work 取消之前的work
	cbNode && cancelCallback(cbNode);
	// 同步流程
	// if (curWork) {
	// 	perform(curWork);
	// }

	// 当前返回值的回调函数
	curCallback = scheduleCallback(curPriority, perform.bind(null, curWork));
}

function perform(work: Work, didTimeout?: boolean) {
	// 完全宏任务 不可中断的
	/**
	1. work.priority 紧迫 不可中断
	2. 饥饿问题 --work一直得不到执行 优先级应该越来越高 直到过期 过期后应该同步执行
	3. 事件切片 时间用尽了 停下来 让浏览器有时间渲染
	
	*/
	// 过期或者是immediatePriority
	const needSync = work.priority === ImmediatePriority || didTimeout;
	// while (work.count) {
	// 	work.count--;
	// 	insertSpan('0');
	// }
	while ((needSync || !shouldYield()) && work.count) {
		work.count--;
		insertSpan(work.priority + '');
	}
	// 中断执行||  执行完后
	// 记录中断前的priority
	prevPriority = work.priority;
	if (!work.count) {
		const workIndex = workList.indexOf(work);
		workList.splice(workIndex, 1);
		prevPriority = IdlePriority;
	}
	const prevCallback = curCallback;
	schedule();
	const newCallback = curCallback;
	// 在schedule中如果curPriority 和prevPriority一直后return curCallback不会有新值 prevCallback 和newCallback一值, 代表了本次调度的还是上一次调度的work
	// 如果不一致 curCallback有新的值 不需要返回一个perform方法执行了
	if (newCallback && prevCallback === newCallback) {
		// 当调度器的返回值是一个函数, 则继续执行perform
		return perform.bind(null, work);
	}
}

function insertSpan(content) {
	const span = document.createElement('span');
	span.innerText = content;
	span.className = `pri-${content}`;
	doSomeBuzyWork(10000000);
	root?.appendChild(span);
}

// button &&
// 	(button.onclick = () => {
// 		workList.unshift({ count: 100 });
// 		schedule();
// 	});
function doSomeBuzyWork(len: number) {
	let result = 0;
	while (len--) {
		result += len;
	}
}
