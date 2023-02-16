// react
import currentDispatcher, {
	Dispatcher,
	resolveDispatcher
} from './src/currentDispatcher';
import { jsx, jsxDEV, isValidElement as isValidElementFun } from './src/jsx';
export const useState: Dispatcher['useState'] = (initialState: any) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useState(initialState);
};

export const useEffect: Dispatcher['useEffect'] = (create, depts);

export const _SECRET_INSIDE_SHARE_LAYER_ = {
	currentDispatcher
};

export const version = '0.0.0';
// TODO 根据环境决定使用jsx 还是jsxDev
export const createElement = jsx;
export const isValidElement = isValidElementFun;
