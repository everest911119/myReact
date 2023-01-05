import { Action } from 'shared/ReactTypes';
export interface Update<State> {
	action: Action<State>;
}
export interface UpdateQuene<State> {
	shared: {
		pending: Update<State> | null;
	};
}
export const createUpdate = <State>(action: Action<State>): Update<State> => {
	return {
		action
	};
};

export const createUpdateQuene = <State>() => {
	return {
		shared: {
			pending: null
		}
	} as UpdateQuene<State>;
};

export const enqueneUpdate = <State>(
	updateQuene: UpdateQuene<State>,
	update: Update<State>
) => {
	updateQuene.shared.pending = update;
};
// 消费updateQuene的方法
export const processUpdateQuene = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null
): { memoizedState: State } => {
	const result: ReturnType<typeof processUpdateQuene<State>> = {
		memoizedState: baseState
	};
	if (pendingUpdate !== null) {
		// 1 baseState 1 update 2 => memorizedState 2
		// 2 baseState 1 update(x)=>2x memorizedState 2
		const action = pendingUpdate.action;
		if (action instanceof Function) {
			result.memoizedState = action(baseState);
		} else {
			result.memoizedState = action;
		}
	}
	return result;
};
