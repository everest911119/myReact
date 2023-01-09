import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbol';
import { Props, ReactElementType } from 'shared/ReactTypes';
import {
	createFiberFromElement,
	createWorkInProgress,
	FiberNode
} from './fiber';
import { ChildDeletion, Placement } from './fiberFlags';
import { HostText } from './workTag';

// 在mounted流程下存在插入大量节点 update时只存在更新局部节点
export function childReconciler(shouldTrackEffects: boolean) {
	function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
		if (!shouldTrackEffects) {
			return;
		}
		const deletions = returnFiber.deletions;
		if (deletions === null) {
			// 当前fiber 没有需要被删除的子节点
			returnFiber.deletions = [childToDelete];
			returnFiber.flag |= ChildDeletion;
		} else {
			deletions.push(childToDelete);
		}
	}
	return function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: ReactElementType
	) {
		function reconcileSingleTextNode(
			returnFiber: FiberNode,
			currentFiber: FiberNode | null,
			content: string | number
		) {
			if (currentFiber !== null) {
				// update流程
				if (currentFiber.tag === HostText) {
					// 类型没有变化
					const existing = useFiber(currentFiber, { content });
					existing.return = returnFiber;
					return existing;
				}
				/**
				 * 之前是<div> 变成了 hahaha 先把div删除之后创建hostText节点
				 */
				deleteChild(returnFiber, currentFiber);
			}
			const fiber = new FiberNode(HostText, { content }, null);
			fiber.return = returnFiber;
			return fiber;
		}
		function reconcileSingleElement(
			returnFiber: FiberNode,
			currentFiber: FiberNode | null,
			element: ReactElementType
		) {
			const key = element.key;
			work: if (currentFiber !== null) {
				// update
				if (currentFiber?.key === key) {
					// key相同
					if (element.$$typeof === REACT_ELEMENT_TYPE) {
						if (currentFiber?.type === element.type) {
							// type相同
							const existing = useFiber(currentFiber, element.props);
							existing.return = returnFiber;
							return existing;
						}
						// 删除旧的
						deleteChild(returnFiber, currentFiber);
						break work;
					} else {
						if (__DEV__) {
							console.warn('not achieve react type', element);
							break work;
						}
					}
				} else {
					// 删掉旧的
					deleteChild(returnFiber, currentFiber);
				}
			}
			// 根据element 创建fiber并返回
			const fiber = createFiberFromElement(element);
			fiber.return = returnFiber;
			return fiber;
		}
		function placeSingleChild(fiber: FiberNode) {
			if (shouldTrackEffects && fiber.alternate === null) {
				// fiber.alternate = null 代表首屏渲染 并且应该追踪副作用
				fiber.flag |= Placement;
			}
			return fiber;
		}
		// 判断当前fiber的类型
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(returnFiber, currentFiber, newChild)
					);
				default:
					if (__DEV__) {
						console.warn('not achieve reconcile type', newChild);
					}
					break;
			}
		}
		// TODO
		// 多节点的情况 ul> li*3
		// HostText
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			);
		}
		if (currentFiber !== null) {
			deleteChild(returnFiber, currentFiber);
		}

		if (__DEV__) {
			console.warn('not achieve reconcile type', newChild);
		}
		return null;
	};
}

function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
	// fiber复用的情况
	const clone = createWorkInProgress(fiber, pendingProps);
	// clone fiber 和现在的fiber alternative 相互指
	clone.index = 0;
	clone.sibling = null;
	return clone;
}

export const reconcileChildFibers = childReconciler(true);
export const mountChildFibers = childReconciler(false);
