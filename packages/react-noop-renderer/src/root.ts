// ReactDOM.createRoot(root).render(<App/>)

import {
	createContainer,
	updateContainer
} from 'react-reconciler/src/fiberRconciler';
import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbol';
import { ReactElementType } from 'shared/ReactTypes';
import { Container, Instance } from './hostconfig';
import * as Scheduler from 'scheduler';
let idCounter = 0;
export function createRoot() {
	const container: Container = {
		rootID: idCounter++,
		children: []
	};
	// @ts-ignore
	const root = createContainer(container);
	function getChildren(parent: Container | Instance) {
		if (parent) {
			return parent.children;
		}
		return null;
	}
	function getChildrenAsJsx(root: Container) {
		const children = childToJsx(getChildren(root));
		if (Array.isArray(children)) {
			return {
				$$typeof: REACT_ELEMENT_TYPE,
				type: REACT_FRAGMENT_TYPE,
				key: null,
				ref: null,
				props: { children },
				_mark: 'myReact_noop_renderer'
			};
		}
		return children;
	}
	// @ts-ignore
	function childToJsx(child: any) {
		// 文本节点
		if (typeof child === 'string' || typeof child === 'number') {
			return child;
		}
		// 数组情况
		if (Array.isArray(child)) {
			if (child.length === 0) {
				return null;
			}
			if (child.length === 1) {
				return childToJsx(child[0]);
			}
			// @ts-ignore
			const children = child.map((child) => childToJsx(child));
			if (
				child.every(
					(child) => typeof child === 'string' || typeof child === 'number'
				)
			) {
				return children.join('');
			}
			// [TextInstance, TextInstacnce, Instance] 包含了instance 和 TextInstance
			return children;
		}
		// Instance
		if (Array.isArray(child.children)) {
			const instance: Instance = child;
			const children = childToJsx(instance.children);
			const props = instance.props;
			if (children !== null) {
				props.children = children;
			}
			return {
				$$typeof: REACT_ELEMENT_TYPE,
				type: instance.type,
				key: null,
				ref: null,
				props,
				_mark: 'myReact_noop_renderer'
			};
		}
		// TextInstance 文本节点
		return child.text;
	}
	return {
		_Scheduler: Scheduler,
		render(element: ReactElementType) {
			return updateContainer(element, root);
		},
		getChildren() {
			return getChildren(container);
		},
		getChildrenAsJsx() {
			return getChildrenAsJsx(container);
		}
	};
}
