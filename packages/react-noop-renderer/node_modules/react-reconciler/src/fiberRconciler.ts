import { Container } from 'hostConfig';
import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode, FiberRootNode } from './fiber';
import { requestUpdateLane } from './fiberlane';
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
	hostRootFiber.clone = false;
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
	// reactDOM.createRoot(root).render(<App />) 这个组件对应的就是element
	const lane = requestUpdateLane();
	const update = createUpdate<ReactElementType | null>(element, lane);
	console.log(element);
	enqueneUpdate(
		hostRootFiber.updateQuene as UpdateQuene<ReactElementType | null>,
		update
	);
	scheduleUpdateOnFiber(hostRootFiber, lane);
	return element;
	//- 实现mount时调用的API
	// - 将该API接入上述更新机制中 下一步需要将renderRoot更新流程连接上
}
