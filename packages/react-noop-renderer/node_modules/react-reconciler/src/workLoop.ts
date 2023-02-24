import { scheduleMicroTask } from 'hostConfig';
import { beginWork } from './beginWork';
import {
	commitHookEffectCreate,
	commitHookEffectDestroy,
	commitHookEffectListUnmount,
	commitMutationEffect
} from './commitWork';
import { completeWork } from './completeWork';
import {
	createWorkInProgress,
	FiberNode,
	FiberRootNode,
	PendingPassiveEffects
} from './fiber';
import { MutationMask, NoFlags, PassiveMask } from './fiberFlags';
import {
	unstable_scheduleCallback as scheduleCallback,
	unstable_NormalPriority as NormalPriority
} from 'scheduler';
import {
	getHighestPriorityLane,
	Lane,
	markRootFinished,
	mergeLane,
	NoLane,
	SyncLane
} from './fiberlane';
import { flushSyncCallbacks, scheduleSyncTaskCallback } from './syncTaskQuene';
import { HostRoot } from './workTag';
import { HookHasEffect, Passive } from './hookEffectTag';

let workInProgress: FiberNode | null = null;
// 本次更新的lane
let wipRootRenderingLane: Lane = NoLane;
// 开是的时候是FiberRootNode 不是普通的fiber
let rootDoesHasPassiveEffects = false;
function prepareFreshStack(root: FiberRootNode, lane: Lane) {
	// 闭包 创造alternative
	workInProgress = createWorkInProgress(root.current, {});
	console.warn('prepare start', workInProgress);
	wipRootRenderingLane = lane;
}

// 每次触发更新都会执行scheduleUpdateOnFiber ensureRootIsScheduled 调度阶段的入口 调度时 把render阶段的入口 传给scheduleSyncTaskCallback 在这个方法中会构造一个数组 如果3次调用setState syqncQuene中会有3个performSyncWorkOnRoot的回调函数 执行3次scheduleMicroTask 在微任务中执行flushSyncCallbacks 后两次再进来的时候由于isFlusingSyncQuene是true会跳出这个方法
// 最终结果是syncQuene只会遍历一次
export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
	// 调度功能
	// 首屏渲染时 是fiberRootNode 当其他节点更新时 需要遍历到根节点 fiberRootNode
	const root = markUpdateFromFiberToRoot(fiber);
	markRootUpdated(root, lane);
	ensureRootIsScheduled(root);
}

function ensureRootIsScheduled(root: FiberRootNode) {
	// 判读机制 所有lanes中优先级最高的
	const updateLane = getHighestPriorityLane(root.pendingLanes);
	if (updateLane === NoLane) {
		// 没有lane就代表没有update 没有更新
		return;
	}
	if (updateLane === SyncLane) {
		// 同步优先级， 用微任务调度
		if (__DEV__) {
			console.log('in microtask schedule priority', updateLane);
		}
		scheduleSyncTaskCallback(
			performSyncWorkOnRoot.bind(null, root, updateLane)
		);
		scheduleMicroTask(flushSyncCallbacks);
	} else {
		// 其他优先级用宏任务调度
	}
}

function markRootUpdated(root: FiberRootNode, lane: Lane) {
	root.pendingLanes = mergeLane(root.pendingLanes, lane);
}

function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber;
	let parent = node.return;
	while (parent !== null) {
		node = parent;
		parent = node.return;
	}
	if (node.tag === HostRoot) {
		// hostRootFiber 与fiberRootNode是以stateNode 和 current 连接的
		return node.stateNode;
	}
	return null;
}

function performSyncWorkOnRoot(root: FiberRootNode, lane: Lane) {
	const nextLane = getHighestPriorityLane(root.pendingLanes);
	if (nextLane !== SyncLane) {
		// 其他比synclane低的优先级
		// NoLane
		ensureRootIsScheduled(root);
		return;
	}
	// 初始化
	prepareFreshStack(root, lane);
	do {
		try {
			workLoop();
			break;
		} catch (e) {
			console.warn('workLoop error', e);
			if (__DEV__) {
				console.warn('workLoop 错误', e);
			}
			workInProgress = null;
		}
	} while (true);

	const finishWork = root.current.alternate;
	root.finishWork = finishWork;
	root.finishedLane = lane;
	wipRootRenderingLane = NoLane;
	// wip fiberNode 树中的flag进行dom操作
	commitRoot(root);
}
function commitRoot(root: FiberRootNode) {
	// commit 阶段 1 beforeMutation, 2 mutation, 3 layout
	const finishWork = root.finishWork;
	if (finishWork === null) {
		return;
	}
	if (__DEV__) {
		console.warn('commit start', finishWork);
	}
	// 移除lane操作
	const lane = root.finishedLane;
	if (lane === NoLane && __DEV__) {
		console.error('commit should not have no lane');
	}
	// 重置
	root.finishWork = null;
	root.finishedLane = NoLane;
	// 判断是否存在3个子阶段需要的操作
	// root flag subtreeflag
	markRootFinished(root, lane);

	if (
		(finishWork.flag && PassiveMask) !== NoFlags ||
		(finishWork.subtreeFlag && PassiveMask) !== NoFlags
	) {
		// 当多次执行
		if (!rootDoesHasPassiveEffects) {
			rootDoesHasPassiveEffects = true;
			// 调度副作用, 类似在setTimeOut中执行一个回调
			scheduleCallback(NormalPriority, () => {
				// 执行副作用(useEffect)
				flushPassiveEffect(root.pendingPassiveEffects);
				return;
			});
		}
	}

	const subtreeHasEffect = (finishWork.subtreeFlag & MutationMask) !== NoFlags;
	const rootHasEffect = (finishWork.flag & MutationMask) !== NoFlags;
	if (subtreeHasEffect || rootHasEffect) {
		// beforeMutation
		// mutation  Placement
		commitMutationEffect(finishWork, root);
		// 变换fiber树
		root.current = finishWork;
		// layout
	} else {
		root.current = finishWork;
	}
	// 当执行结束后
	rootDoesHasPassiveEffects = false;
	ensureRootIsScheduled(root);
}
function flushPassiveEffect(pendingPassiveEffects: PendingPassiveEffects) {
	// 对于 useEffect来说, 需要先执行destroy回调, 再依次执行useEffect回调
	// useEffect的任何回调必须在上次更新的destroy回调执行完以后再执行
	pendingPassiveEffects.unMount.forEach((effect) => {
		commitHookEffectListUnmount(Passive, effect);
	});
	pendingPassiveEffects.unMount = [];
	pendingPassiveEffects.update.forEach((effect) => {
		commitHookEffectDestroy(Passive | HookHasEffect, effect);
	});
	pendingPassiveEffects.update.forEach((effect) => {
		commitHookEffectCreate(Passive | HookHasEffect, effect);
	});
	pendingPassiveEffects.update = [];
	// 在useEffect中可能存在useState更新流程
	flushSyncCallbacks();
}
function workLoop() {
	while (workInProgress !== null) {
		performUnitOfwork(workInProgress);
	}
}

function performUnitOfwork(fiber: FiberNode) {
	const next = beginWork(fiber, wipRootRenderingLane);
	// 执行完成后

	fiber.memoizedProps = fiber.pendingProps;
	if (next === null) {
		// 没有子fiber 已经到最深层了
		completeUnitOfwork(fiber);
	} else {
		workInProgress = next;
	}
}

function completeUnitOfwork(fiber: FiberNode) {
	// 遍历兄弟节点
	let node: FiberNode | null = fiber;
	do {
		completeWork(node);
		const sibling = node.sibling;
		if (sibling !== null) {
			workInProgress = sibling;
			return;
		}
		// 递归向上 sibling不存在
		node = node.return;
		workInProgress = node;
	} while (node !== null);
}
