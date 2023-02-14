import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbol';
import { Key, Props, ReactElementType } from 'shared/ReactTypes';
import {
	createFiberFromElement,
	createFiberFromFragment,
	createWorkInProgress,
	FiberNode
} from './fiber';
import { ChildDeletion, Placement } from './fiberFlags';
import { Fragment, HostText } from './workTag';
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
		/** type是fregment 的reactElement 
		 * <ul>
  <>
    <li>1</li>
    <li>2</li>
  </>
  <li>3</li>
  <li>4</li>
</ul>
		 * jsxs('ul', {
  children: [
    jsxs(Fragment, {
      children: [
        jsx('li', {
          children: '1'
        }),
        jsx('li', {
          children: '2'
        })
      ]
    }),
    jsx('li', {
      children: '3'
    }),
    jsx('li', {
      children: '4'
    })
  ]
});
		 * 
		 * 
		 */
		// 最后一个可复用的fiber在current 中的index
		let lastPlacedIndex = 0;
		// 创建的最后一个fiber
		let lastNewFiber: FiberNode | null = null;
		// 创建的第一个fiber 最终返回的是第一个fiber
		let firstNewFiber: FiberNode | null = null;

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
			// newFiber 可能是一个复用的fiber 或者是一个新的fiber
			// 如果更新后是false null
			if (newFiber === null) {
				continue;
			}
			// 3. 标记移动还是插入
			// 移动 具体是指向右移动 判断依据是element index 与 element 对应的fiber 的index 比较 A1 B2 C3 > B2 C3 A1
			// 对于 A1 节点更新之前是0 之后是2 当遍历elements时 当前遍历到的element 一定是以遍历的element 最靠右的
			// 只需要记录最后一个可复用的fiber在current 中的索引位置 lastPlacedIndex e.g. 当遍历B2是 在current fiber 中的index 是 1 记录1
			// 如果接下来遍历的可复用的fiber 的index < lastPlacedIndex 标记为Placement
			// 遍历到B2 找之前是否也存在B2 lastPlacedIndex = 1 接着遍历到C3是 index 是 2 index>lastPlacedIndex
			// C3 相对于B2的位置没有变化 lastPlacedIndex 更新为2 C3的索引
			// 最后遍历到A1 currentFiber的索引值是0  0<2 index<lastPlacedIndex 在更新之前 A1 在 C3的左边, 更新后A1在c3的右边 标记移动 A1 标记placement 移动
			newFiber.index = i;
			newFiber.return = returnFiber;
			if (lastNewFiber === null) {
				lastNewFiber = newFiber;
				firstNewFiber = newFiber;
			} else {
				lastNewFiber.sibling = newFiber;
				lastNewFiber = lastNewFiber.sibling;
			}
			if (!shouldTrackEffects) {
				continue;
			}
			const current = newFiber.alternate;
			if (current !== null) {
				const oldIndex = current.index;
				if (oldIndex < lastPlacedIndex) {
					// 移动
					newFiber.flag |= Placement;
					continue;
				} else {
					// 不移动
					lastPlacedIndex = oldIndex;
				}
			} else {
				// current null mount阶段
				newFiber.flag |= Placement;
			}
		}

		// 4 将map中剩下的标记为删除
		existingChildren.forEach((fiber) => {
			deleteChild(returnFiber, fiber);
		});
		// 此时placement对应的DOM方法是parenetNode.appendChild 现在placement 多了一层移动 需要支持parentNode.insertBefore
		return firstNewFiber;
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
		const before = existingChildren.get(keyToUse);
		// 1. element 是HostText,
		if (typeof element === 'string' || typeof element === 'number') {
			if (before) {
				if (before.tag === HostText) {
					// before也是hostText 可以复用 删除existingChild 中的值
					existingChildren.delete(keyToUse);
					// 复用当前的fiber
					return useFiber(before, { content: element + '' });
				}
			}
			// 不能复用 新创建一个fiberNode 相比于singleElement 需要标记删除不能复用的节点 arrayChild在第四步 把map中剩余的节点都标记删除
			return new FiberNode(HostText, { content: element + '' }, null);
		}
		// 2 element 是其他的ReactElement 类型
		if (typeof element === 'object' && element !== null) {
			switch (element.$$typeof) {
				case REACT_ELEMENT_TYPE:
					// 处理fragement
					if (element.type === REACT_FRAGMENT_TYPE) {
						return updateFragment(
							returnFiber,
							before,
							element,
							keyToUse,
							existingChildren
						);
					}
					if (before) {
						if (before.type === element.type) {
							// key 相同 type 也相同 可以复用
							existingChildren.delete(keyToUse);
							return useFiber(before, element.props);
						}
					}
					return createFiberFromElement(element);
			}
			//3 . TODO 数组类型 {[<li/>,<li/>]}
			if (Array.isArray(element) && __DEV__) {
				console.warn('array child not achieved yet');
				return null;
			}
		}
		/*
		处理array
// arr = [<li>c</li>, <li>d</li>]


<ul>
  <li>a</li>
  <li>b</li>
  {arr}
</ul>


// 对应DOM
<ul>
  <li>a</li>
  <li>b</li>
  <li>c</li>
  <li>d</li>
</ul>
*/
		if (Array.isArray(element)) {
			return updateFragment(
				returnFiber,
				before,
				element,
				keyToUse,
				existingChildren
			);
		}
		return null;
	}
	return function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: any
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
						// 单节点情况下 判读fragment
						let props = element.props;
						if (element.type === REACT_FRAGMENT_TYPE) {
							props = element.props.children;
						}
						if (currentFiber?.type === element.type) {
							// type相同 type 相同 当前节点可以复用
							const existing = useFiber(currentFiber, props);
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
			// 如果不存在任何复用的可能性 创建新的
			// 根据element 创建fiber并返回
			let fiber: FiberNode;
			if (element.type === REACT_FRAGMENT_TYPE) {
				fiber = createFiberFromFragment(element.props.children, key);
			} else {
				fiber = createFiberFromElement(element);
			}
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
		// 判读freagment
		/***
		 * <>
  <div></div>
  <div></div>
</>
		 * JSX 转换结果是
jsxs(Fragment, {
  children: [
      jsx("div", {}), 
      jsx("div", {})
  ]
});

		 */

		const isUnkeyedTopLevelFragment =
			typeof newChild === 'object' &&
			newChild !== null &&
			newChild.type === REACT_FRAGMENT_TYPE &&
			newChild.key === null;
		if (isUnkeyedTopLevelFragment) {
			// 不需要遍历
			// 如果是fragment newChild 就是数组 变成isArray逻辑
			newChild = newChild.props.children;
		}
		// 判断当前fiber的类型
		if (typeof newChild === 'object' && newChild !== null) {
			// 多节点的情况 ul> li*3
			if (Array.isArray(newChild)) {
				return reconcileChildArray(returnFiber, currentFiber, newChild);
			}
		}

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

		// HostText
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			);
		}
		if (currentFiber !== null) {
			// deleteChild(returnFiber, currentFiber);
			deleteRemainingChildren(returnFiber, currentFiber);
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
function updateFragment(
	returnFiber: FiberNode,
	current: FiberNode | undefined,
	elements: any[],
	key: Key,
	existingChildren: ExistingChildren
) {
	let fiber;
	if (!current || current.tag !== Fragment) {
		// 创建新的fragement
		fiber = createFiberFromFragment(elements, key);
	} else {
		// 复用fragment
		existingChildren.delete(key);
		fiber = useFiber(current, elements);
	}
	fiber.return = returnFiber;
	return fiber;
}
export const reconcileChildFibers = childReconciler(true);
export const mountChildFibers = childReconciler(false);
