const button = document.querySelector('button');
interface Work {
	// 某一个工作要执行的次数， react中组件的数量组件render的数量
	count: number;
}
const workList: Work[] = [];
const schedule() {
  
}


button &&
	(button.onclick = () => {
		workList.unshift({ count: 100 });
	});
