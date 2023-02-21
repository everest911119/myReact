// 调度同步任务
let syncQuene: ((...args: any) => void)[] | null = null;
let isFlusingSyncQuene = false;
export function scheduleSyncTaskCallback(callback: (...args: any) => void) {
	if (syncQuene === null) {
		// 第一个回调函数
		syncQuene = [callback];
	} else {
		syncQuene.push(callback);
	}
}

// 执行
export function flushSyncCallbacks() {
	if (!isFlusingSyncQuene && syncQuene) {
		isFlusingSyncQuene = true;
		try {
			syncQuene.forEach((callback) => callback());
		} catch (e) {
			if (__DEV__) {
				console.error('flushSyncQuene wrong', e);
			}
		} finally {
			isFlusingSyncQuene = false;
			syncQuene = null;
		}
	}
}
