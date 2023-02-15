import { Dispatch } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';
import { Lane, Lanes } from './fiberlane';
export interface Update<State> {
	action: Action<State>;
	next: Update<any> | null;
	lane: Lane;
}
export interface UpdateQuene<State> {
	shared: {
		pending: Update<State> | null;
	};
	dispatch: Dispatch<State> | null;
}
export const createUpdate = <State>(
	action: Action<State>,
	lane: Lane
): Update<State> => {
	return {
		action,
		lane,
		next: null
	};
};

export const createUpdateQuene = <State>() => {
	return {
		shared: {
			pending: null
		},
		dispatch: null
	} as UpdateQuene<State>;
};

export const enqueneUpdate = <State>(
	updateQuene: UpdateQuene<State>,
	update: Update<State>
) => {
	// 此时update是覆盖操作 需要变成链表结构
	const pending = updateQuene.shared.pending;
	// 当前的updateQuene中没有插入新的update
	if (pending === null) {
		// a-》a a和自己形成了一个环状链表
		update.next = update;
	} else {
		// 下一个update b b.next = a.next
		update.next = pending.next;
		// a.next = b
		pending.next = update;
	}
	// pending b->a->b
	// c c.next = b.next
	// b.next = c
	// pending = c
	// pending = c->a->b->c
	updateQuene.shared.pending = update;
	// updateQuene.shared.pending.next 环状链表的第一个update
};
// 消费updateQuene的方法

/**
 * const onClick = () => {
  // 创建3个update
  updateCount((count) => count + 1);
  updateCount((count) => count + 1);
  updateCount((count) => count + 1);
}; 点击事件触发更新-> 创建3个update a b c -> pending c-a-b-c
	进入fiber的beginWork 
 * 获取pending.next => a-> 
	处理函数 第一次 baseState0 -> 1
	pending赋值为pending.next b -> 执行function baseState 2 -> pending.next c-> baseState 3 赋值给memorizedState
 */

export const processUpdateQuene = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null,
	renderLane: Lane
): { memoizedState: State } => {
	const result: ReturnType<typeof processUpdateQuene<State>> = {
		memoizedState: baseState
	};
	if (pendingUpdate !== null) {
		// pending c->a->b->c中最先插入的 update
		// 第一个update
		const first = pendingUpdate.next;
		// pending 是最后一个
		let pending = pendingUpdate;
		do {
			const updateLane = pending.lane;
			if (updateLane === renderLane) {
				// 1 baseState 1 update 2 => memorizedState 2
				// 2 baseState 1 update(x)=>2x memorizedState 2
				const action = pending.action;
				if (action instanceof Function) {
					baseState = action(baseState);
				} else {
					baseState = action;
				}
			} else {
				if (__DEV__) {
					console.error('something wrong updateLane !== renderLane');
				}
			}
			pending = pending?.next as Update<any>;
		} while (pending !== first);
	}
	result.memoizedState = baseState;
	return result;
};
