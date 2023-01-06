import { appendChildToContainer, Container } from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import { MutationMask, NoFlags, Placement } from './fiberFlags';
import { HostComponent, HostRoot } from './workTag';

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
};
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
