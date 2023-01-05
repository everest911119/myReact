import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTag';

let workInProgress: FiberNode | null = null;

// 开是的时候是FiberRootNode 不是普通的fiber
function prepareFreshStack(root: FiberRootNode) {
	workInProgress = createWorkInProgress(root.current, {});
}

export function scheduleUpdateOnFiber(fiber: FiberNode) {
	// 调度功能
	// 首屏渲染时 是fiberRootNode 当其他节点更新时 需要遍历到根节点 fiberRootNode
	const root = markUpdateFromFiberToRoot(fiber);
	renderRoot(root);
}

function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber;
	let parent = node.return;
	while (parent !== null) {
		node = parent;
		parent = node.return;
	}
	if (node.tag === HostRoot) {
		// hostRootFiber 与fiberRootNode是以stateNode 和 current 连接的
		return node.stateNode;
	}
	return null;
}

function renderRoot(root: FiberRootNode) {
	// 初始化
	prepareFreshStack(root);
	do {
		try {
			workLoop();
			break;
		} catch (e) {
			console.warn('workLoop error', e);
			workInProgress = null;
		}
	} while (true);
}
function workLoop() {
	while (workInProgress !== null) {
		performUnitOfwork(workInProgress);
	}
}

function performUnitOfwork(fiber: FiberNode) {
	const next = beginWork(fiber);
	// 执行完成后

	fiber.memoizedProps = fiber.pendingProps;
	if (next === null) {
		// 没有子fiber 已经到最深层了
		completeUnitOfwork(fiber);
	} else {
		workInProgress = next;
	}
}

function completeUnitOfwork(fiber: FiberNode) {
	// 遍历兄弟节点
	let node: FiberNode | null = fiber;
	do {
		completeWork(node);
		const sibling = node.sibling;
		if (sibling !== null) {
			workInProgress = sibling;
			return;
		}
		// 递归向上 sibling不存在
		node = node.return;
	} while (node !== null);
}
