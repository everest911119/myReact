import {
	appendInitialChild,
	Container,
	createInstance,
	createTextInstacne,
	Instance
} from 'hostConfig';
// 这里依赖react-dom当打包react-noop-renderer时会报错
// import { updateFiberProps } from 'react-dom/src/SyntheticEvent';
import { FiberNode } from './fiber';
import { NoFlags, Update } from './fiberFlags';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText,
	Fragment
} from './workTag';

// 标记更新
function markUpdate(fiber: FiberNode) {
	fiber.flag |= Update;
}

export const completeWork = (wip: FiberNode) => {
	// 递归中的归 从下向上
	const newProps = wip.pendingProps;
	const current = wip.alternate;
	switch (wip.tag) {
		case HostComponent:
			// 构建离屏的dom树

			if (current !== null && wip.stateNode) {
				// stateNode保存了dom节点--update
				// 1 props是否变化 {onClick:xx} {onClick:xxx}
				// 2如果变了 updateFlag
				markUpdate(wip);
				// updateFiberProps(wip.stateNode, newProps);
			} else {
				// mount时
				// 1 构建domm

				const instance = createInstance(wip.type, newProps);
				// 2 将dom插入到dom树中
				// 将离屏dom挂载在创建的dom下
				appendAllChildren(instance, wip);
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			return null;
		case HostText:
			if (current !== null && wip.stateNode) {
				// stateNode保存了dom节点--update
				const oldText = current.memoizedProps.content;
				const newText = newProps.content;
				if (oldText !== newText) {
					markUpdate(wip);
				}
			} else {
				// 1 构建domm

				const instance = createTextInstacne(newProps.content);
				// 2 将dom插入到dom树中
				// 将离屏dom挂载在创建的dom下
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			return null;

			return null;
		case HostRoot:
		case Fragment:
		case FunctionComponent:
			bubbleProperties(wip);
			return null;
		default:
			if (__DEV__) {
				console.warn('not complete work ', wip);
			}
			break;
	}
};
function appendAllChildren(parent: Container | Instance, wip: FiberNode) {
	/**
	 * 希望在parent下插入wip节点, wip可能不是dom节点, 对wip进行递归 寻找hostComponent 如果找到进行appendChild操作
	 * 如果到头 向上找 找sibling
	 *
	 */

	/**
	 * function A(){
	 * return <div></div>
	 * }
	 *
	 * <h3><A/></h3> 插入时实际上插入的是div
	 */

	let node = wip.child;
	while (node !== null) {
		if (node?.tag === HostComponent || node?.tag === HostText) {
			appendInitialChild(parent, node?.stateNode);
		} else if (node.child !== null) {
			node.child.return = node;
			node = node.child;
			continue;
		}
		if (node === wip) {
			return;
		}
		while (node.sibling === null) {
			if (node.return === null || node.return === wip) {
				// 回到了原点
				return;
			}
			// 继续向上
			node = node?.return;
		}
		node.sibling.return = node.return;
		node = node?.sibling;
	}
}

/***
 *
 * 当递归结束后 得到了fiberNode Tree 和 标记副作用的flags 需要找到那些节点标记了flag并对其进行操作
 * 在completeWork向上遍历的过程 把子fiberNode的flag冒泡到父fiberNode 最后知道子树中是否存在flag
 */
function bubbleProperties(wip: FiberNode) {
	let subtreeFlag = NoFlags;
	let child = wip.child;
	while (child !== null) {
		// 包含了子节点的flag 和subtreeflag
		subtreeFlag |= child.subtreeFlag;
		subtreeFlag |= child.flag;
		child.return = wip;
		child = child.sibling;
	}
	wip.subtreeFlag |= subtreeFlag;
}
