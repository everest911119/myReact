import { Action } from 'shared/ReactTypes';

// 当前react 的共享层
export interface Dispatcher {
	useState: <T>(initalState: T | (() => T)) => [T, Dispatch<T>];
	// const [num, updateNUm] = useState(0) 也可以接受一个函数 useState(num=>num+1)
}
export type Dispatch<State> = (action: Action<State>) => void;
const currentDispatcher: { current: Dispatcher | null } = {
	current: null
};
export const resolveDispatcher = (): Dispatcher => {
	const dispatcher = currentDispatcher.current;
	if (dispatcher === null) {
		throw new Error('hook can only run on Function Component');
	}
	return dispatcher;
};

export default currentDispatcher;
