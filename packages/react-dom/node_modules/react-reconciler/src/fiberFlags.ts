export const NoFlags = 0b000000;
export const Placement = 0b000001;
export const Update = 0b000010;
export const ChildDeletion = 0b000100;
export type Flags = number;
// 本次更新触发需要触发useEffect情况
export const PassiveEffect = 0b001000;
export const MutationMask = Placement | Update | ChildDeletion;

// 如果组件卸载了 useEffect 中return 需要执行
export const PassiveMask = PassiveEffect | ChildDeletion;
