import { ReactElementType } from 'shared/ReactTypes';
import { mountChildFibers, reconcileChildFibers } from './childFibers';
import { FiberNode } from './fiber';
import { processUpdateQuene, UpdateQuene } from './updateQuenue';
import { HostComponent, HostRoot, HostText } from './workTag';

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
		default:
			if (__DEV__) {
				console.warn('not achieve type');
			}
			return null;
			break;
	}
	return null;
};

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
		wip.child = reconcileChildFibers(wip, current?.child, children);
	} else {
		// mount 流程
		wip.child = mountChildFibers(wip, null, children);
	}
}
