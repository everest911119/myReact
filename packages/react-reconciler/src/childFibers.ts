import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbol';
import { ReactElementType } from 'shared/ReactTypes';
import { createFiberFromElement, FiberNode } from './fiber';
import { Placement } from './fiberFlags';
import { HostText } from './workTag';

// 在mounted流程下存在插入大量节点 update时只存在更新局部节点
export function childReconciler(shouldTrackEffects: boolean) {
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
			const fiber = new FiberNode(HostText, { content }, null);
			fiber.return = returnFiber;
			return fiber;
		}
		function reconcileSingleElement(
			returnFiber: FiberNode,
			currentFiber: FiberNode | null,
			element: ReactElementType
		) {
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
		if (__DEV__) {
			console.warn('not achieve reconcile type', newChild);
		}
		return null;
	};
}

export const reconcileChildFibers = childReconciler(true);
export const mountChildFibers = childReconciler(false);
