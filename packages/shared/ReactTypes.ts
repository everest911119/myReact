export type Type = any;
export type Key = any;
export type Ref = any;
export type Props = any;
export type ElementType = any;
export interface ReactElementType {
	$$typeof: symbol | number;
	key: Key;
	props: Props;
	ref: Ref;
	_mark: string;
	type: ElementType;
}
export type Action<State> = State | ((prevstate: State) => State);
