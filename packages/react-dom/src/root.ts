// ReactDOM.createRoot(root).render(<App/>)

import {
	createContainer,
	updateContainer
} from 'react-reconciler/src/fiberRconciler';
import { ReactElementType } from 'shared/ReactTypes';
import { Container } from './hostconfig';
import { initEvent } from './SyntheticEvent';

export function createRoot(container: Container) {
	const root = createContainer(container);
	return {
		render(element: ReactElementType) {
			// 代理点击事件
			initEvent(container, 'click');
			return updateContainer(element, root);
		}
	};
}
