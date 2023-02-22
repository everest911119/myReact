// ReactDOM.createRoot(root).render(<App/>)

import {
	createContainer,
	updateContainer
} from 'react-reconciler/src/fiberRconciler';
import { ReactElementType } from 'shared/ReactTypes';
import { Container, Instance } from './hostconfig';
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
	return {
		render(element: ReactElementType) {
			// 代理点击事件
			return updateContainer(element, root);
		},
		getChildren() {
			return getChildren(container);
		}
	};
}
