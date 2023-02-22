import { FiberNode } from 'react-reconciler/src/fiber';
import { HostComponent, HostText } from 'react-reconciler/src/workTag';
import { Props } from 'shared/ReactTypes';
// hostRoot
export interface Container {
	rootID: number;
	children: (Instance | TextInstance)[];
}
// hostComponent
export interface Instance {
	id: number;
	type: string;
	children: (Instance | TextInstance)[];
	parent: number;
	props: Props;
}
// hostText
export interface TextInstance {
	text: string;
	id: number;
	parent: number;
}
let instanceCounter = 0;
export const createInstance = (type: string, props: Props) => {
	const instance = {
		id: instanceCounter++,
		type,
		children: [],
		parent: -1,
		props
	};
	return instance;
};

export const appendInitialChild = (
	parent: Instance | Container,
	child: Instance
) => {
	// 之前parentId
	const prevParentID = child.parent;
	// 要插入的parentId
	const parentID = 'rootID' in parent ? parent.rootID : parent.id;
	if (prevParentID !== -1 && prevParentID !== parentID) {
		// prevParentId !== -1 child已经被插入一个parent下了 需要执行一个重复的插入操作
		throw new Error('cannot attach child');
	}
	child.parent = parentID;
	parent.children.push(child);
};
export const createTextInstacne = (content: string) => {
	const instance = {
		text: content,
		id: instanceCounter++,
		parent: -1
	};
	return instance;
};
export const appendChildToContainer = (parent: Container, child: Instance) => {
	const prevParentID = child.parent;
	if (prevParentID !== -1 && prevParentID !== parent.rootID) {
		throw new Error('不能重复挂载child');
	}
	child.parent = parent.rootID;
	parent.children.push(child);
};
export function commitUpdate(fiber: FiberNode) {
	switch (fiber.tag) {
		case HostText:
			const text = fiber.memoizedProps.content;
			return commitTextUpdate(fiber.stateNode, text);
			break;
		// 如果hostComponent变化了 执行createInstance里的方法updateFiberProps
		case HostComponent:
		default:
			if (__DEV__) {
				console.warn('no finish update Type');
			}
			break;
	}
}
export function commitTextUpdate(testInstance: TextInstance, content: string) {
	testInstance.text = content;
}
export function removeChild(
	child: Instance | TextInstance,
	container: Container
) {
	const index = container.children.indexOf(child);
	if (index === -1) {
		throw new Error('child不存在');
	}
	container.children.splice(index, 1);
}

export function insertChildToContainer(
	child: Instance,
	container: Container,
	before: Instance
) {
	const beforeIndex = container.children.indexOf(before);
	if (beforeIndex === -1) {
		throw new Error('before不存在');
	}
	const index = container.children.indexOf(child);
	if (index !== -1) {
		// child存在于children中 先移除再插入
		container.children.splice(index, 1);
	}
	container.children.splice(beforeIndex, 0, child);
}

export const scheduleMicroTask =
	typeof queueMicrotask === 'function'
		? queueMicrotask
		: typeof Promise === 'function'
		? (callback: (...args: any) => void) => Promise.resolve().then(callback)
		: setTimeout;
