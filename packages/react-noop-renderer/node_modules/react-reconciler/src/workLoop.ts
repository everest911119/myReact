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
	unstable_NormalPriority as NormalPriority,
	unstable_shouldYield,
	unstable_cancelCallback
} from 'scheduler';
import {
	getHighestPriorityLane,
	Lane,
	lanesToSchedulerPriority,
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
type RootExitStatus = number;
// root 没有执行完
const RootInComplete = 1;
// root执行完了
const RootCompleted = 2;
// TODO执行时报错
function prepareFreshStack(root: FiberRootNode, lane: Lane) {
	root.finishedLane = NoLane;
	root.finishWork = null;
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
	console.log(root, 'root');
	ensureRootIsScheduled(root);
}

function ensureRootIsScheduled(root: FiberRootNode) {
	// 判读机制 所有lanes中优先级最高的
	const updateLane = getHighestPriorityLane(root.pendingLanes);
	const existingCallback = root.callbackNode;
	if (updateLane === NoLane) {
		// 没有lane就代表没有update 没有更新
		if (existingCallback !== null) {
			unstable_cancelCallback(existingCallback);
		}
		root.callbackNode = null;
		root.callbackPriority = NoLane;
		return;
	}

	// 判读当前优先级 和现在优先级是否一直
	const curPriority = updateLane;
	const prevPriority = root.callbackPriority;
	if (curPriority === prevPriority) {
		// 同一优先级更新 不需要产生新的调度
		return;
	}
	if (existingCallback !== null) {
		unstable_cancelCallback(existingCallback);
	}
	let newCallbackNode = null;

	if (updateLane === SyncLane) {
		// 同步优先级， 用微任务调度
		if (__DEV__) {
			console.log('in microtask schedule priority', updateLane);
		}
		// debugger;
		scheduleSyncTaskCallback(
			performSyncWorkOnRoot.bind(null, root, updateLane)
		);
		scheduleMicroTask(flushSyncCallbacks);
	} else {
		// 其他优先级用宏任务调度
		const schedulerPriority = lanesToSchedulerPriority(updateLane);
		newCallbackNode = scheduleCallback(
			schedulerPriority,
			// @ts-ignore
			performConcurrentWorkOnRoot.bind(null, root)
		);
	}
	// 如果同步更新 callbackNode 是null
	root.callbackNode = newCallbackNode;
	root.callbackPriority = curPriority;
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
// 并发更新,可以中断
function performConcurrentWorkOnRoot(
	root: FiberRootNode,
	didTimeout: boolean
): any {
	// 当并发更新开始时 要保证之前的useEffect 回调已经执行了
	// function App() {
	// 	useEffect(()=>{
	// 		updatexxx 如果这个优先级很高 高过正在调度的优先级 当前更新被打断 开始更高优先级的调度
	// 	})
	// }
	const curCallback = root.callbackNode;
	const didFlushPassiveEffect = flushPassiveEffect(root.pendingPassiveEffects);
	if (didFlushPassiveEffect) {
		// 触发了更新 并且触发更新的优先级比现在调度的优先级更高
		if (root.callbackNode !== curCallback) {
			return null;
		}
	}
	// 当前的lane
	const lane = getHighestPriorityLane(root.pendingLanes);
	const currCallbacNode = root.callbackNode;
	if (lane === NoLane) {
		return null;
	}
	const needSync = lane === SyncLane || didTimeout;
	// render
	const exitStatus = renderRoot(root, lane, !needSync);
	ensureRootIsScheduled(root);
	if (exitStatus === RootInComplete) {
		// 中断
		if (root.callbackNode !== currCallbacNode) {
			// 有一个更高优先级的插入
			return null;
		}
		return performConcurrentWorkOnRoot.bind(null, root);
	}
	if (exitStatus === RootCompleted) {
		// 更新完了
		const finishWork = root.current.alternate;
		root.finishWork = finishWork;
		wipRootRenderingLane = NoLane;
		commitRoot(root);
	} else if (__DEV__) {
		console.error('还未实现的并发更新结束状态');
	}
}

// 调度过程中不可中断
function performSyncWorkOnRoot(root: FiberRootNode) {
	const nextLane = getHighestPriorityLane(root.pendingLanes);
	if (nextLane !== SyncLane) {
		// 其他比synclane低的优先级
		// NoLane
		ensureRootIsScheduled(root);
		return;
	}
	// 退出的状态
	const exitStatus = renderRoot(root, nextLane, false);
	if (exitStatus === RootCompleted) {
		const finishWork = root.current.alternate;
		root.finishWork = finishWork;
		root.finishedLane = nextLane;
		wipRootRenderingLane = NoLane;
		// wip fiberNode 树中的flag进行dom操作
		commitRoot(root);
	} else if (__DEV__) {
		console.error('未实现同步更新结束状态');
	}
}

function renderRoot(root: FiberRootNode, lane: Lane, shouldTimeSlice: boolean) {
	if (__DEV__) {
		console.log(`开始${shouldTimeSlice ? '并发' : '同步'}更新`, root);
	}
	if (wipRootRenderingLane !== lane) {
		// 初始化
		prepareFreshStack(root, lane);
	}

	do {
		try {
			shouldTimeSlice ? workLoopConcurrent() : workLoopSync();
			break;
		} catch (e) {
			console.warn('workloop error', e);
			if (__DEV__) {
				console.warn('wookloop 错误', e);
			}
			workInProgress = null;
		}
	} while (true);
	// 中断执行 或者执行结束 render节端
	if (shouldTimeSlice && workInProgress !== null) {
		// 工作没有执行完
		// 中断执行
		return RootInComplete;
	}
	if (!shouldTimeSlice && workInProgress !== null && __DEV__) {
		console.error('render阶段结束时wip 应该是null', workInProgress);
	}
	// TODO 报错

	return RootCompleted;
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
			console.log('start schedule');
			scheduleCallback(NormalPriority, () => {
				// 执行副作用(useEffect)
				flushPassiveEffect(root.pendingPassiveEffects);
				return;
			});
		}
	}
	console.log('remove flag');
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
	let didFlushPassiveEffect = false;
	// 对于 useEffect来说, 需要先执行destroy回调, 再依次执行useEffect回调
	// useEffect的任何回调必须在上次更新的destroy回调执行完以后再执行
	pendingPassiveEffects.unMount.forEach((effect) => {
		didFlushPassiveEffect = true;
		commitHookEffectListUnmount(Passive, effect);
	});
	pendingPassiveEffects.unMount = [];
	pendingPassiveEffects.update.forEach((effect) => {
		didFlushPassiveEffect = true;
		commitHookEffectDestroy(Passive | HookHasEffect, effect);
	});
	pendingPassiveEffects.update.forEach((effect) => {
		didFlushPassiveEffect = true;
		commitHookEffectCreate(Passive | HookHasEffect, effect);
	});
	pendingPassiveEffects.update = [];
	// 在useEffect中可能存在useState更新流程
	flushSyncCallbacks();
	return didFlushPassiveEffect;
}
// 不可中断
function workLoopSync() {
	while (workInProgress !== null) {
		performUnitOfwork(workInProgress);
	}
}

// 可以中断
function workLoopConcurrent() {
	while (workInProgress !== null && !unstable_shouldYield()) {
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
