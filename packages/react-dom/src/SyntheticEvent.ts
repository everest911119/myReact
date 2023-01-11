import { Container } from 'hostConfig';
import { Props } from 'shared/ReactTypes';
// 合成事件
export const elementPropsKey = '__props';
type EventCallback = (e: Event) => void;
interface Paths {
	capture: EventCallback[];
	bubble: EventCallback[];
}
interface SyntheticEvent extends Event {
	__stopPropagation: boolean;
}
export interface DOMElement extends Element {
	[elementPropsKey]: Props;
}

export function updateFiberProps(node: DOMElement, props: Props) {
	node[elementPropsKey] = props;
}
const validEvnetTypeList = ['click'];
// 定义初始化事件
export function initEvent(container: Container, eventType: string) {
	if (!validEvnetTypeList.includes(eventType)) {
		console.warn('not support', eventType);
	}
	if (__DEV__) {
		console.warn('init event', eventType);
	}
	container.addEventListener(eventType, (e) => {
		dispatchEvent(container, eventType, e);
	});
}

function dispatchEvent(container: Container, eventType: string, e: Event) {
	const targetElement = e.target;
	if (targetElement === null) {
		console.warn('target not exist in event', e);
		return;
	}
	// 1 收集事件 从targetElement到container中所有事件的回调
	const { bubble, capture } = collectPaths(
		targetElement as DOMElement,
		container,
		eventType
	);
	// 2 构造合成事件
	// 3 变量capture
	// 4 遍历bubble
}

function getEventCallbackNameFromEventType(
	eventType: string
): string[] | undefined {
	return {
		click: ['onClickCapture', 'onClick']
	}[eventType];
}

// 收集沿途的事件
function collectPaths(
	targetElement: DOMElement,
	container: Container,
	eventType: string
) {
	const paths: Paths = {
		capture: [],
		bubble: []
	};
	while (targetElement && targetElement !== container) {
		// 收集--冒泡过程 从子节点向上
		const elementProps = targetElement[elementPropsKey];
		if (elementProps) {
			// click -> onClick and onClickCapture
			const callBackNameList = getEventCallbackNameFromEventType(eventType);
			if (callBackNameList) {
				callBackNameList.forEach((calbackName, i) => {
					const eventCallback = elementProps[calbackName];
					if (eventCallback) {
						if (i === 0) {
							// capture 需要反向插入 破获阶段,根节点在最上面从上往下 container->targetElement
							paths.capture.unshift(eventCallback);
						} else {
							paths.bubble.push(eventCallback);
						}
					}
				});
			}
		}
		targetElement = targetElement.parentNode as DOMElement;
	}
	return paths;
}

// 构造合成事件

// function createSyntheticEvent(e: Event) {}
