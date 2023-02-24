import { FiberRootNode } from './fiber';

// lane二进制代表优先级
export type Lane = number;
// lanes 代表lane的集合
export type Lanes = number;
export const SyncLane = 0b0001;
export const NoLane = 0b0000;
export const NoLanes = 0b0000;
export function mergeLane(laneA: Lane, laneB: Lane): Lanes {
	return laneA | laneB;
}

export function requestUpdateLane() {
	return SyncLane;
}
// 获取优先级最高的lane
export function getHighestPriorityLane(lanes: Lanes): Lane {
	// 负数的补码的规则，符号不变， 其余位取反， 最后是加1
	return lanes & -lanes;
}

export function markRootFinished(root: FiberRootNode, lane: Lane) {
	root.pendingLanes &= ~lane;
}
