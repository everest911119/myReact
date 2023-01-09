import { FiberNode } from 'react-reconciler/src/fiber';
import { HostText } from 'react-reconciler/src/workTag';

export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;
export const createInstance = (type: string, props: any) => {
	// TODO 处理props
	const element = document.createElement(type);
	return element;
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
