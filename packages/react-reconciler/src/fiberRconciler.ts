import { Container } from 'hostConfig';
import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode, FiberRootNode } from './fiber';
import {
	createUpdate,
	createUpdateQuene,
	enqueneUpdate,
	UpdateQuene
} from './updateQuenue';
import { scheduleUpdateOnFiber } from './workLoop';
import { HostRoot } from './workTag';

export function createContainer(container: Container) {
	// 初始化
	const hostRootFiber = new FiberNode(HostRoot, {}, null);
	const root = new FiberRootNode(container, hostRootFiber);
	hostRootFiber.updateQuene = createUpdateQuene();
	return root;
}
// 当执行render时会调用updateContainer
export function updateContainer(
	element: ReactElementType,
	root: FiberRootNode
) {
	const hostRootFiber = root.current;
	// 触发更新
	const update = createUpdate<ReactElementType | null>(element);
	enqueneUpdate(
		hostRootFiber.updateQuene as UpdateQuene<ReactElementType | null>,
		update
	);
	scheduleUpdateOnFiber(hostRootFiber);
	return element;
	//- 实现mount时调用的API
	// - 将该API接入上述更新机制中 下一步需要将renderRoot更新流程连接上
}