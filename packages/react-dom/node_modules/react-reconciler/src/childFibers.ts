import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbol';
import { Props, ReactElementType } from 'shared/ReactTypes';
import {
	createFiberFromElement,
	createWorkInProgress,
	FiberNode
} from './fiber';
import { ChildDeletion, Placement } from './fiberFlags';
import { HostText } from './workTag';
type ExistingChildren = Map<string | number, FiberNode>;
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
	function reconcileChildArray(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChild: any[]
	) {
		// 1.将current 保存在map 中
		const existingChildren: ExistingChildren = new Map();
		let current = currentFirstChild;
		while (current !== null) {
			const keyToUse = current.key !== null ? current.key : current.index;
			existingChildren.set(keyToUse, current);
			current = current.sibling;
		}
		for (let i = 0; i < newChild.length; i++) {
			// 2. 遍历newChild 寻找是否可以复用
			// key 从map中获取current fiber 如果不存在currentFiber 没有复用的可能性
			const after = newChild[i];
			const newFiber = updateFromMap(returnFiber, existingChildren, i, after);
			if (newFiber === null) {
				continue;
			}
			// 3. 标记移动还是插入
		}

		// 4 将map中剩下的标记为删除
	}
	// 判断是否可以复用
	function updateFromMap(
		returnFiber: FiberNode,
		existingChildren: ExistingChildren,
		index: number,
		element: any
	): FiberNode | null {
		// element 的key是什么
		const keyToUse = element.key !== null ? element.key : index;
		// 更新前对应的fiber节点
		return null;
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
			while (currentFiber !== null) {
				// update流程
				if (currentFiber.tag === HostText) {
					// 类型没有变化 可以复用
					const existing = useFiber(currentFiber, { content });
					deleteRemainingChildren(returnFiber, currentFiber.sibling);
					existing.return = returnFiber;
					return existing;
				}
				/**
				 * 之前是<div> 变成了 hahaha 先把div删除之后创建hostText节点
				 */
				deleteChild(returnFiber, currentFiber);
				// 当前节点不能复用
				currentFiber = currentFiber.sibling;
			}
			const fiber = new FiberNode(HostText, { content }, null);
			fiber.return = returnFiber;
			return fiber;
		}
		function deleteRemainingChildren(
			returnFiber: FiberNode,
			currentFirstChild: FiberNode | null
		) {
			if (!shouldTrackEffects) {
				return;
			}
			let childToDelete = currentFirstChild;
			while (childToDelete !== null) {
				deleteChild(returnFiber, childToDelete);
				childToDelete = childToDelete.sibling;
			}
		}
		function reconcileSingleElement(
			returnFiber: FiberNode,
			currentFiber: FiberNode | null,
			element: ReactElementType
		) {
			const key = element.key;
			work: while (currentFiber !== null) {
				// update
				if (currentFiber?.key === key) {
					// key相同
					if (element.$$typeof === REACT_ELEMENT_TYPE) {
						if (currentFiber?.type === element.type) {
							// type相同 type 相同 当前节点可以复用
							const existing = useFiber(currentFiber, element.props);
							existing.return = returnFiber;
							// 当前节点可以复用， 剩下的节点删除 这里是处理singleElement 处理结束后只有一个节点
							deleteRemainingChildren(returnFiber, currentFiber.sibling);
							return existing;
						}
						// key 相同 type 不同 删除所以的旧的
						deleteRemainingChildren(returnFiber, currentFiber);
						break work;
					} else {
						if (__DEV__) {
							console.warn('not achieve react type', element);
							break work;
						}
					}
				} else {
					// key 不同 删掉旧的 寻找下一个sibling
					deleteChild(returnFiber, currentFiber);
					currentFiber = currentFiber.sibling;
				}
			}
			// 如果不存在任何复用的可能性
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
			// TODO
			// 多节点的情况 ul> li*3
			if (Array.isArray(newChild)) {
				return reconcileChildArray(returnFiber, currentFiber, newChild);
			}
		}

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
