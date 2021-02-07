import { ChildProcess, fork } from 'child_process';


/**
 * IPC的服务进程，主进程
 * @author featherJ
 */
class IPCServer {
	private callIndex: number = 0;
	private child: ChildProcess;
	public onReceiveHandler: (messageId: string, data: any) => void;

	constructor(modulePath: string) {
		this.error_handler = this.error_handler.bind(this);
		this.exit_handler = this.exit_handler.bind(this);
		this.message_handler = this.message_handler.bind(this);

		this.child = fork(modulePath);
		this.child.addListener('error', this.error_handler);
		this.child.addListener('exit', this.exit_handler);
		this.child.addListener('message', this.message_handler);
	}

	private error_handler(error: Error): void {
		// console.log(error);
	}

	private exit_handler(code: number, signal: string): void {
		// console.log(code,signal);
	}

	private message_handler(msg: any): void {
		var type: string = msg.type;
		if (type == 'custom') {
			var messageId: string = msg.messageId;
			var data: any = msg.data;
			this.onReceived(messageId, data);
			return;
		}

		var funcName: string = msg.funcName;
		var callIndex: number = msg.callIndex;
		var key: string = funcName + '_' + callIndex;
		var callbackInfo = this.callbackMap[key];
		delete this.callbackMap[key];
		if (callbackInfo) {
			if (type == 'result') {
				var result: any = msg.result;
				callbackInfo.resolve(result);
			} else if (type == 'error') {
				var error: any = msg.error;
				callbackInfo.reject(error);
			} else if (type == 'null') {
				callbackInfo.reject(`Method ${funcName} was not found in the child process`);
			}
		}
	}
	/**
	 * 接收到子进程发来的数据
	 * @param messageId 
	 * @param data 
	 */
	private onReceived(messageId: string, data: any): void {
		if (this.onReceiveHandler) {
			this.onReceiveHandler(messageId, data);
		}
	}

	private callbackMap: { [funcName: string]: { resolve: (value?: any) => void, reject: (reason?: any) => void } } = {};
	/**
	 * 调用child的方法
	 * @param funcName 方法名
	 * @param args 参数
	 */
	public call(funcName: string, args: any[]): Promise<any> {
		var callIndex = this.callIndex++;
		this.send({ funcName, callIndex, args });
		return new Promise((resolve, reject) => {
			this.callbackMap[funcName + '_' + callIndex] = {
				resolve: resolve,
				reject: reject
			};
		});
	}

	private send(data: any): void {
		if (this.child && this.child.connected) {
			this.child.send(data);
		}
	}
}

/**
 * 子进程持有者
 * @author featherJ
 */
export class NodeProcessOwner extends IPCServer {
}

/**
 * 创建一个子进程
 * @param modulePath 子进程路径
 * @param onReceive 子进程路径
 */
export function createChildProcess<T>(modulePath: string, onReceive?: (messageId: string, data: any) => void): T {
	var server: IPCServer = new NodeProcessOwner(modulePath);
	server.onReceiveHandler = onReceive;
	var proxy = new Proxy<IPCServer>(server, {
		get(target: IPCServer, property: string) {
			if (property in target) {
				return target[property];
			} else {
				return function (...args) {
					return target.call(property, args);
				};
			}
		}
	});
	return proxy as any;
}