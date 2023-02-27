import reactDomConfig from './react-dom.config';
import reactConfig from './react.config';
import reactNoopRerenederConfig from './react-noop-rereneder.config';
export default () => {
	return [...reactConfig, ...reactDomConfig, ...reactNoopRerenederConfig];
};
