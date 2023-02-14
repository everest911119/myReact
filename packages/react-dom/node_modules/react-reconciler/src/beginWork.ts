import { ReactElementType } from 'shared/ReactTypes';
import { mountChildFibers, reconcileChildFibers } from './childFibers';
import { FiberNode } from './fiber';
import { renderWithHooks } from './fiberHooks';
import { processUpdateQuene, UpdateQuene } from './updateQuenue';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText,
	Fragment
} from './workTag';

// 递归中的递阶段
export const beginWork = (wip: FiberNode) => {
	// 比较, 返回子fiberNode
	switch (wip.tag) {
		case HostRoot:
			//1  计算状态的最新址
			return updateHostRoot(wip);
		// 2 创建子fiberNode
		case HostComponent:
			// hostComponent 只创建子节点
			return updateHostComponent(wip);
		case HostText:
			return null;
		case FunctionComponent:
			return updateFunctionComponent(wip);
		// 处理fragment的情况
		case Fragment:
			return updateFragment(wip);
		default:
			if (__DEV__) {
				console.warn('not achieve type');
			}
			return null;
			break;
	}
	return null;
};
// fragement
function updateFragment(wip: FiberNode) {
	const nextChildren = wip.pendingProps;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}
// function Component
function updateFunctionComponent(wip: FiberNode) {
	const nextProps = wip.pendingProps;
	const nextChild = renderWithHooks(wip);
	/**
	 * function component
	 * function App() {
	 * 	reutrn <img/>
	 * }
	 *  function component 需要调用app函数得到image 组件
	 * nextchild 是function component 的执行结果
	 */
	reconcileChildren(wip, nextChild);
	return wip.child;
}
function updateHostRoot(wip: FiberNode) {
	const baseState = wip.memoizedState;
	const updateQuene = wip.updateQuene as UpdateQuene<Element>;
	const pending = updateQuene.shared.pending;
	updateQuene.shared.pending = null;
	// 当前的最新状态
	const { memoizedState } = processUpdateQuene(baseState, pending);
	wip.memoizedState = memoizedState;
	// 创建子fiberNode
	const nextChild = wip.memoizedState;
	// 返回子fibernode
	reconcileChildren(wip, nextChild);
	return wip.child;
}

function updateHostComponent(wip: FiberNode) {
	// hostComponent 里面没有触发更新
	// <div><span/></div> sapn 在div的props里
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.children;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

// hostText 没有子节点 e.g<p>1232</p>

function reconcileChildren(wip: FiberNode, children: ReactElementType) {
	/**
	 * 
	<A>
	 	<B/>
	<A>
	当进入A的beginWork时 对比b current FiberNode 与B reactElement 生产B对应的 wip fiberNode, 
	 */
	const current = wip.alternate;
	if (current !== null) {
		// update流程
		wip.child = reconcileChildFibers(wip, current.child, children);
	} else {
		// mount 流程
		wip.child = mountChildFibers(wip, null, children);
	}
}
