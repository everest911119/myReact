// 当前环境是否支持symbol
const supportSymbol = typeof Symbol === 'function' && Symbol.for;

export const REACT_ELEMENT_TYPE = supportSymbol
	? Symbol.for('react.element')
	: 0xeac7;

// react Fragment type

export const REACT_FRAGMENT_TYPE = supportSymbol
	? Symbol.for('react.fragement')
	: 0xeacbb;
