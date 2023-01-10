import {
	appendChildToContainer,
	commitUpdate,
	Container,
	removeChild
} from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import {
	ChildDeletion,
	MutationMask,
	NoFlags,
	Placement,
	Update
} from './fiberFlags';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTag';

let nextEffect: FiberNode | null = null;
export const commitMutationEffect = (finishWork: FiberNode) => {
	nextEffect = finishWork;
	// 向下遍历并找到flag节点
	while (nextEffect !== null) {
		const child: FiberNode | null = nextEffect.child;
		if ((nextEffect.subtreeFlag & MutationMask) !== NoFlags && child !== null) {
			nextEffect = child;
		} else {
			//向上变量 到了最后的节点 或者没有subtreeflag节点
			up: while (nextEffect !== null) {
				commitMutationEffectOnFiber(nextEffect);
				const sibling: FiberNode | null = nextEffect.sibling;
				if (sibling !== null) {
					nextEffect = sibling;
					break up;
				}
				nextEffect = nextEffect.return;
			}
		}
	}
};
const commitMutationEffectOnFiber = (finishWork: FiberNode) => {
	const flag = finishWork.flag;
	if ((flag & Placement) !== NoFlags) {
		commitPlacement(finishWork);
		// 将placement操作符移除
		finishWork.flag &= ~Placement;
	}
	if ((flag & Update) !== NoFlags) {
		commitUpdate(finishWork);
		finishWork.flag &= ~Update;
	}
	if ((flag & ChildDeletion) !== NoFlags) {
		const deletions = finishWork.deletions;
		if (deletions !== null) {
			deletions.forEach((childToDelete) => {
				commitDeletion(childToDelete);
			});
		}
	}
};
function commitDeletion(childToDelete: FiberNode) {
	// 递归子树的操作
	// 对于fc 处理useEffect unMount执行 解绑ref
	// 对于 hostComponent 解绑ref
	// 对于子树的根hostComponnet 需要移除DOM
	// 子树根的hostCoponent
	let rootHostNode: FiberNode | null = null;
	/***
	 *  如
	 * <div>
	 * 	<App />
	 * 	<p />
	 * </div>
	 * function App () {
	 * 	return <p>123</p>
	 * }
	 * div-app触发 unmountfiber 函数 根据不同类型分别处理
	 * 最后向上递归 回到原点 最后赋值rootHostNode
	 */

	// 递归子树
	commitNestedComponent(childToDelete, (unmountFiber) => {
		switch (unmountFiber.tag) {
			case HostComponent:
				if (rootHostNode === null) {
					rootHostNode = unmountFiber;
				}
				// TODO 解绑ref
				break;
			case HostText:
				if (rootHostNode === null) {
					rootHostNode = unmountFiber;
				}
				return;
			case FunctionComponent:
				// TODO useEffect unmount处理
				return;
			default:
				if (__DEV__) {
					console.warn('not solve unmount type', unmountFiber);
				}
				break;
		}
	});
	// 移除dom
	if (rootHostNode !== null) {
		const hostParent = getHostParent(childToDelete);
		if (hostParent !== null) {
			removeChild((rootHostNode as FiberNode).stateNode, hostParent);
		}
	}
	childToDelete.return = null;
	childToDelete.child = null;
}

function commitNestedComponent(
	root: FiberNode,
	onCommitUnmount: (fiber: FiberNode) => void
) {
	let node = root;
	while (true) {
		onCommitUnmount(node);
		// 向下遍历
		if (node.child !== null) {
			node.child.return = node;
			node = node.child;
			continue;
		}
		if (node.child === root) {
			// 终止条件
			return;
		}
		while (node.sibling === null) {
			if (node.return === null || node.return === root) {
				return;
			}
			// 向上递归
			node = node.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

const commitPlacement = (finishWork: FiberNode) => {
	if (__DEV__) {
		console.warn('执行placement操作', finishWork);
	}
	// parent DOM
	const hostParent = getHostParent(finishWork);
	// finishWork ~DOM dom appendChild 到parent 上
	if (hostParent !== null) {
		appendPlacementNodeToContainer(finishWork, hostParent);
	}
};

function getHostParent(fiber: FiberNode): Container | null {
	let parent = fiber.return;
	while (parent) {
		const parentTag = parent.tag;
		// hostComponent hostRoot
		if (parentTag === HostComponent) {
			return parent.stateNode as Container;
		}
		if (parentTag === HostRoot) {
			return (parent.stateNode as FiberRootNode).container;
		}
		parent = parent.return;
	}
	if (__DEV__) {
		console.warn('未找到host parent');
	}
	return null;
}

function appendPlacementNodeToContainer(
	finishWork: FiberNode,
	hostParent: Container
) {
	// fiber host
	if (finishWork.tag === HostComponent || finishWork.tag === HostRoot) {
		appendChildToContainer(hostParent, finishWork.stateNode);
		return;
	}
	const child = finishWork.child;
	if (child !== null) {
		appendPlacementNodeToContainer(child, hostParent);
		let sibling = child.sibling;
		while (sibling !== null) {
			appendPlacementNodeToContainer(sibling, hostParent);
			sibling = sibling.sibling;
		}
	}
}
