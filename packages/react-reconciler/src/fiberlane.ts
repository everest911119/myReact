import {
	unstable_getCurrentPriorityLevel,
	unstable_IdlePriority,
	unstable_ImmediatePriority,
	unstable_NormalPriority,
	unstable_UserBlockingPriority
} from 'scheduler';
import { FiberRootNode } from './fiber';

// lane二进制代表优先级
export type Lane = number;
// lanes 代表lane的集合
export type Lanes = number;
export const SyncLane = 0b0001;
export const NoLane = 0b0000;
// 连续的输入
export const InputContinousLane = 0b0010;
export const DefaultLane = 0b0100;
export const IdleLane = 0b1000;
export const NoLanes = 0b0000;
export function mergeLane(laneA: Lane, laneB: Lane): Lanes {
	return laneA | laneB;
}

export function requestUpdateLane() {
	// 从上下文环境中获取优先级
	const currentSchedulerPriority = unstable_getCurrentPriorityLevel();
	// 这里是调度器的优先级 返回是 react中类模型 在react中使用类模型 需要进行转换
	const lane = schedulerPriorityToLane(currentSchedulerPriority);
	return lane;
}
// 获取优先级最高的lane
export function getHighestPriorityLane(lanes: Lanes): Lane {
	// 负数的补码的规则，符号不变， 其余位取反， 最后是加1
	return lanes & -lanes;
}

export function markRootFinished(root: FiberRootNode, lane: Lane) {
	root.pendingLanes &= ~lane;
}

export function lanesToSchedulerPriority(lanes: Lanes) {
	const lane = getHighestPriorityLane(lanes);
	if (lane === SyncLane) {
		return unstable_ImmediatePriority;
	}
	if (lane === InputContinousLane) {
		return unstable_UserBlockingPriority;
	}
	if (lane === DefaultLane) {
		return unstable_NormalPriority;
	}
	return unstable_IdlePriority;
}

export function schedulerPriorityToLane(schedulerPriority: number) {
	if (schedulerPriority === unstable_ImmediatePriority) {
		return SyncLane;
	}
	if (schedulerPriority === unstable_UserBlockingPriority) {
		return InputContinousLane;
	}
	if (schedulerPriority === unstable_NormalPriority) {
		return DefaultLane;
	}
	return NoLane;
}
