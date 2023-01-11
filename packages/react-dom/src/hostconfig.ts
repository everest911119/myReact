import { FiberNode } from 'react-reconciler/src/fiber';
import { HostComponent, HostText } from 'react-reconciler/src/workTag';
import { DOMElement, updateFiberProps } from './SyntheticEvent';

export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;
export const createInstance = (type: string, props: any) => {
	// TODO 处理props
	const element = document.createElement(type) as unknown;
	// 调用事件的方法
	updateFiberProps(element as DOMElement, props);
	return element as DOMElement;
};

export const appendInitialChild = (
	parent: Instance | Container,
	child: Instance
) => {
	parent.appendChild(child);
};
export const createTextInstacne = (content: string) => {
	return document.createTextNode(content);
};
export const appendChildToContainer = appendInitialChild;
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
	testInstance.textContent = content;
}
export function removeChild(
	child: Instance | TextInstance,
	container: Container
) {
	container.removeChild(child);
}
