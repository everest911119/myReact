// fiberNode是什么类型的节点
export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText;
export const FunctionComponent = 0;
// HostRoot是挂载类型的根节点
export const HostRoot = 3;
// div
export const HostComponent = 5;
// <div>123</div>
export const HostText = 6;
