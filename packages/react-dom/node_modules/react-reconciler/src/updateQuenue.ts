import { Dispatch } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';
import { isSubsetofLanes, Lane, Lanes } from './fiberlane';
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
): {
	memoizedState: State;
	baseState: State;
	baseQueue: Update<State> | null;
} => {
	const result: ReturnType<typeof processUpdateQuene<State>> = {
		memoizedState: baseState,
		baseState: baseState,
		baseQueue: null
	};
	if (pendingUpdate !== null) {
		// pending c->a->b->c中最先插入的 update
		// 第一个update
		const first = pendingUpdate.next;
		// pending 是最后一个
		let pending = pendingUpdate.next;
		do {
			const updateLane = pending?.lane as Lane;
			if (!isSubsetofLanes(renderLane, updateLane)) {
				// 处理优先级不够的逻辑
				// 由于高优先级任务会打断低优先级任务, 同一个组件根据update计算state可能执行多次， 所以要保存state
				// update的连续性， 和update的优先级
				// 1. baseState是本次参与更新的初始state
				//  memoiziatedState是上次更新的state
				// 2 . 如果本次更新没有跳过 下次更新的baseState= memoiziatedState
				// 3 如果本次更新update有跳过 本次更新的memoiziatedState是考虑优先级情况下的计算结果 baseState是最后一个没被跳过的update计算后的结果， 下次更新baseState!== memoiziatedState
				// 4. 本次更新被跳过的update以及后面所有update,都会被保存在baseQueue中参与下一次state的计算
				// 5. 参与计算保存在baseQueue中的update 优先级会被降低到Nolane 判断优先级是取交集的情况，任何优先级&NoLane = NoLane 所有无论下一次优先级是什么都会参与优先级的计算
				// u0
				// {
				//   action: num => num + 1,
				//   lane: DefaultLane
				// }
				// // u1
				// {
				//   action: 3,
				//   lane: SyncLane
				// }
				// // u2
				// {
				//   action: num => num + 10,
				//   lane: DefaultLane
				// }
				/*
				 * 第一次render
				 * baseState = 0; memoizedState = 0;
				 * baseQueue = null; updateLane = DefaultLane;
				 * 第一次render 第一次计算
				 * baseState = 1; memoizedState = 1;
				 * baseQueue = null;
				 * 第一次render 第二次计算
				 * baseState = 1; memoizedState = 1;
				 * baseQueue = u1;
				 * 第一次render 第三次计算
				 * baseState = 1; memoizedState = 11;
				 * baseQueue = u1 -> u2(NoLane);
				 */
				/*
				 * 第二次render
				 * baseState = 1; memoizedState = 11;
				 * baseQueue = u1 -> u2(NoLane); updateLane = SyncLane
				 * 第二次render 第一次计算
				 * baseState = 3; memoizedState = 3;
				 * 第二次render 第二次计算
				 * baseState = 13; memoizedState = 13;
				 */
			} else {
				// 优先级足够
				// 1 baseState 1 update 2 => memorizedState 2
				// 2 baseState 1 update(x)=>2x memorizedState 2
				const action = pending?.action;
				if (action instanceof Function) {
					baseState = action(baseState);
				} else {
					baseState = action;
				}
			}
			pending = pending?.next as Update<any>;
		} while (pending !== first);
	}
	result.memoizedState = baseState;
	return result;
};
