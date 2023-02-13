import {
	appendChildToContainer,
	commitUpdate,
	Container,
	insertChildToContainer,
	Instance,
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
	// 当处理freagment是可能有个子根的host节点
	// 	<div>
	//   <>
	//     <p>xxx</p>
	//     <p>yyy</p>
	//   </>
	// </div>

	const rootChildrenToDelete: FiberNode[] = [];
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
				recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber);
				// TODO 解绑ref
				return;
			case HostText:
				recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber);
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
	if (rootChildrenToDelete.length) {
		const hostParent = getHostParent(childToDelete);
		if (hostParent !== null) {
			rootChildrenToDelete.forEach((node) => {
				removeChild((node as FiberNode).stateNode, hostParent);
			});
		}
	}
	childToDelete.return = null;
	childToDelete.child = null;
}

function recordHostChildrenToDelete(
	childrenToDelete: FiberNode[],
	unmountFiber: FiberNode
) {
	// 1 找到第一个rootHost节点
	const lastOne = childrenToDelete[childrenToDelete.length - 1];
	if (!lastOne) {
		// 第一个
		childrenToDelete.push(unmountFiber);
	} else {
		let node = lastOne.sibling;
		while (node !== null) {
			if (unmountFiber === node) {
				childrenToDelete.push(unmountFiber);
			}
			node = node.sibling;
		}
	}
	// 2 每找到一个host节点 判读这个节点是不是找到那个节点的兄弟节点
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

	// host siblinig
	const sibling = getHostSibling(finishWork);

	// host sibling parentNode.insertBefore 需要找到目标兄弟的Host节点，
	// 1 可能并不是目标fiber的直接兄弟节点
	/** A 组件的兄弟节点不B节点 而是B组件下的div节点 A 的host节点是兄弟节点的child
	 * 需要遍历sibling 至到找到sibling下的host 节点
	 *  情况1 <A/><B/>
	 * function B() {
	 * 	return <div />
	 * }
	 * 情况2
	 * <app /> <div />
	 * function App() {
	 * 	return <A/>
	 * }
	 *  A组件的host类型的兄弟节点是他父节点的兄弟节点
	 * 需要向上找
	 * getHostSibling 函数
	 */

	// finishWork ~DOM dom appendChild 到parent 上
	if (hostParent !== null) {
		insertOrappendPlacementNodeToContainer(finishWork, hostParent);
	}
};
function getHostSibling(fiber: FiberNode) {
	let node: FiberNode = fiber;
	findSibling: while (true) {
		// 向上遍历
		while (node.sibling === null) {
			const parent = node.return;
			if (
				parent === null ||
				parent.tag === HostComponent ||
				parent.tag === HostText
			) {
				return null;
			}
			node = parent;
		}
		// 遍历兄弟节点 遍历到后找子孙节点的host类型 如果找到一个稳定的 HostText 或者 hostComponent 类型 对应找到了节点
		// 如果向下遍历没有找到那么向上遍历找父节点的兄弟节点
		node.sibling.return = node.return;
		node = node.sibling;
		while (node.tag !== HostText && node.tag !== HostComponent) {
			// 向下遍历 找子孙节点 不稳定的host节点 不能作为目标兄弟的host节点
			// B A placement
			if ((node.flag & Placement) !== NoFlags) {
				continue findSibling;
			}
			if (node.child === null) {
				continue findSibling;
			} else {
				node.child.return = node;
				node = node.child;
			}
			if ((node.flag & Placement) === NoFlags) {
				// 找到了host节点
				return node.stateNode;
			}
		}
	}
}
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

function insertOrappendPlacementNodeToContainer(
	finishWork: FiberNode,
	hostParent: Container,
	before?: Instance
) {
	// fiber host
	if (finishWork.tag === HostComponent || finishWork.tag === HostRoot) {
		if (before) {
			insertChildToContainer(finishWork.stateNode, hostParent, before);
		} else {
			appendChildToContainer(hostParent, finishWork.stateNode);
		}

		return;
	}
	const child = finishWork.child;
	if (child !== null) {
		insertOrappendPlacementNodeToContainer(child, hostParent);
		let sibling = child.sibling;
		while (sibling !== null) {
			insertOrappendPlacementNodeToContainer(sibling, hostParent);
			sibling = sibling.sibling;
		}
	}
}
