import { Props, Key, Ref } from 'shared/ReactTypes';
import { WorkTag } from './workTag';
import { Flags, NoFlags } from './fiberFlags';
import { Container } from 'hostConfig';
export class FiberNode {
	type: any;
	tag: WorkTag;
	pendingProps: Props;
	key: Key;
	ref: Ref;
	stateNode: any;
	return: FiberNode | null;
	sibling: FiberNode | null;
	child: FiberNode | null;
	index: number;
	memoizedProps: Props;
	memoizedState: any;
	// current fiberNode 与 wip fiberNode之间的切换
	alternate: FiberNode | null;
	flag: Flags;
	updateQuene: unknown;
	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		// 实例
		this.tag = tag;
		this.key = key;
		// hostComponent 如果是div save div dom
		this.stateNode = null;
		// if functionComponent ()=>{}
		this.type = null;
		// 指向父fiberNode 构成树状结构
		this.return = null;
		this.sibling = null;
		this.child = null;
		this.index = 0;
		this.ref = null;

		// 作为工作单元
		this.pendingProps = pendingProps;
		this.updateQuene = null;
		this.memoizedState = null;
		// 确定下来的props
		this.memoizedProps = null;
		this.alternate = null;
		// 副作用
		this.flag = NoFlags;
	}
}

// 根节点的更新

export class FiberRootNode {
	container: Container;
	current: FiberNode;
	finishWork: FiberNode | null;
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;
		this.finishWork = null;
	}
}

export const createWorkInProgress = (
	current: FiberNode,
	pendingProps: Props
): FiberNode => {
	let wip = current.alternate;
	// 双缓冲机制 每一次获取对应的fiberNode
	if (wip === null) {
		// mount
		// 首屏渲染时 wip 是null
		wip = new FiberNode(current.tag, pendingProps, current.key);

		wip.stateNode = current.stateNode;
		wip.alternate = current;
		current.alternate = wip;
	} else {
		// update
		wip.pendingProps = pendingProps;
		wip.flag = NoFlags;
	}
	wip.type = current.type;
	wip.updateQuene = current.updateQuene;
	wip.child = current.child;
	wip.memoizedState = current.memoizedState;
	wip.memoizedProps = current.memoizedProps;
	return wip;
};
