import { FiberNode } from './fiber';
import internals from 'shared/internals';
import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import {
	createUpdate,
	createUpdateQuene,
	enqueneUpdate,
	processUpdateQuene,
	UpdateQuene
} from './updateQuenue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';
// 当前rendering的fiber fiber 中memoizedState指向hook的链表
let currentlyRenderingFiber: FiberNode | null = null;
const { currentDispatcher } = internals;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;
interface Hook {
	memoizedState: any;
	updateQueue: unknown;
	next: Hook | null;
}
/**
 *  对于fc component fiberNode memoizedState指向hook的链表
 *  每个链表中的hook 对应hook的数据结构 hook数据结构中有memoizedStete字段
 * 这个字段保存了hook自身的值
 *
 */

export function renderWithHooks(wip: FiberNode) {
	// render之前进行赋值操作
	currentlyRenderingFiber = wip;
	// 在执行hook操作时创建链表
	wip.memoizedState = null;

	const current = wip.alternate;
	if (current !== null) {
		// update
		currentDispatcher.current = HooksDispatcheronUpdate;
	} else {
		// mount
		currentDispatcher.current = HooksDispatcherOnMount;
	}

	const Component = wip.type;
	const props = wip.pendingProps;
	// render component
	const children = Component(props);
	// render之后进行重置操作
	currentlyRenderingFiber = null;
	workInProgressHook = null;
	currentHook = null;
	return children;
}

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
};
// update时的dispatcher;
const HooksDispatcheronUpdate: Dispatcher = {
	useState: updateState
};

function updateState<State>(): [State, Dispatch<State>] {
	// 找到useState当前的数据
	const hook = updateWorkInProgresHook();
	// 实现updateState中新的state的逻辑
	const queue = hook.updateQueue as UpdateQuene<State>;
	const pending = queue.shared.pending;
	if (pending !== null) {
		const { memoizedState } = processUpdateQuene(hook.memoizedState, pending);
		hook.memoizedState = memoizedState;
	}
	return [hook.memoizedState, queue.dispatch as Dispatch<State>];
}

function updateWorkInProgresHook(): Hook {
	// 触发更新可能在交互阶段
	// update(100)
	// TODO在交互阶段 onClick = update(100)
	let nextCurrentHook: Hook | null;
	if (currentHook === null) {
		// FC update时的第一个hook
		const current = currentlyRenderingFiber?.alternate;
		if (current !== null) {
			nextCurrentHook = current?.memoizedState;
		} else {
			nextCurrentHook = null;
		}
	} else {
		// FC update时后续的动作
		nextCurrentHook = currentHook.next;
	}
	/****
	 * 如果本次更新比上一次更新多
	 * mount/update u1 u2 u3
	 * /update      u1 u2 u3 u4
	 *
	 */
	if (nextCurrentHook === null) {
		throw new Error(
			`组件${currentlyRenderingFiber?.type}本次执行时hook比上次多`
		);
	}

	currentHook = nextCurrentHook as Hook;
	const newHook: Hook = {
		memoizedState: currentHook.memoizedState,
		updateQueue: currentHook.updateQueue,
		next: null
	};
	if (workInProgressHook === null) {
		if (currentlyRenderingFiber === null) {
			throw new Error('use Hook in Function Component');
		} else {
			workInProgressHook = newHook;
			currentlyRenderingFiber.memoizedState = workInProgressHook;
		}
	} else {
		workInProgressHook.next = newHook;
		workInProgressHook = newHook;
	}
	return workInProgressHook;
}

function mountState<State>(
	initalState: State | (() => State)
): [State, Dispatch<State>] {
	// 找到当前useState对应的hook数据
	const hook = mountWorkInProgressHook();
	let memoizedState;
	if (initalState instanceof Function) {
		memoizedState = initalState();
	} else {
		memoizedState = initalState;
	}
	const queue = createUpdateQuene<State>();
	debugger;
	hook.updateQueue = queue;
	hook.memoizedState = memoizedState;
	// @ts-ignore
	const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
	queue.dispatch = dispatch;
	return [memoizedState, dispatch];
}
// dispatch方法 接入现有的更新流程

function dispatchSetState<State>(
	fiber: FiberNode,
	updateQueue: UpdateQuene<State>,
	action: Action<State>
) {
	const update = createUpdate(action);
	enqueneUpdate(updateQueue, update);
	// 调度更新
	scheduleUpdateOnFiber(fiber);
}
function mountWorkInProgressHook(): Hook {
	const hook: Hook = {
		memoizedState: null,
		next: null,
		updateQueue: null
	};
	if (workInProgressHook === null) {
		// mount时 第一个hook
		if (currentlyRenderingFiber === null) {
			throw new Error('hook must be used in Function Component');
		} else {
			// mount后 将第一次赋值
			workInProgressHook = hook;
			currentlyRenderingFiber.memoizedState = workInProgressHook;
		}
	} else {
		// mount时 后续的hook
		workInProgressHook.next = hook;
		// 更新workinProgressHook指向
		workInProgressHook = workInProgressHook.next;
	}
	return workInProgressHook;
}
