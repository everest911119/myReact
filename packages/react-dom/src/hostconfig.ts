export type Container = Element;
export type Instance = Element;
export const createInstance = (type: string, props: any) => {
	// TODO 处理props
	const element = document.createElement(type);
	return element;
};

export const appendInitialChild = (
	parent: Instance | Container,
	child: Instance
) => {
	parent.appendChild(child);
};
export const createTextInstacne = (content: string) => {
	return document.createTextNode(content);
};
export const appendChildToContainer = appendInitialChild;
