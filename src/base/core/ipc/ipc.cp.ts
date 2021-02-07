import * as fs from 'fs';
/**
 * IPC客户端
 * @author featherJ
 */
class IPCClient {
	constructor() {
		this.message_handler = this.message_handler.bind(this);
		process.addListener('message', this.message_handler);
	}

	private message_handler(msg: any): void {
		var args: any[] = msg.args;
		var funcName: string = msg.funcName;
		var callIndex: number = msg.callIndex;

		if (funcName in this) {
			var func = this[funcName] as Function;
			var result = func.apply(this, args);
			if (result instanceof Promise) {
				result.then(result => {
					this.callResult(funcName, callIndex, result);
				}, error => {
					this.callError(funcName, callIndex, error);
				});
			} else {
				this.callResult(funcName, callIndex, result);
			}
		} else {
			this.callNull(funcName, callIndex);
		}
	}

	private callResult(funcName: string, callIndex: number, result: any): void {
		this.doSend({ type: 'result', funcName, callIndex, result });
	}
	private callError(funcName: string, callIndex: number, error: any): void {
		this.doSend({ type: 'error', funcName, callIndex, error });
	}
	private callNull(funcName: string, callIndex: number): void {
		this.doSend({ type: 'null', funcName, callIndex });
	}
	private doSend(data: any): void {
		process.send(data);
	}
	/**
	 * 发送数据到主进程
	 * @param data 
	 */
	public send(messageId: string, data: any): void {
		this.doSend({ type: 'custom', messageId, data });
	}
	/**
	 * 退出子线程
	 * @param code 
	 */
	public exit(code?: number):void{
		process.exit(code);
	}
}



/**
 * 子进程基类
 * @author featherJ
 */
export class NodeProcess extends IPCClient {
}

/**
 * 进程节点接口
 */
export interface INodeProcess{
	/**
	 * 退出子线程
	 * @param code 
	 */
	exit(code?: number):void
}