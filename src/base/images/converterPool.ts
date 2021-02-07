import { createChildProcess } from "../core/ipc/ipcserver.cp";
import { IConverterProcess } from "./converter";
import { ISlice } from "./core/slice";
import * as path from 'path';

/**
 * 转换进程池
 */
export class ConverterPool {

    private pool: IConverterProcess[];
    private maxSize: number;
    constructor(maxSize: number) {
        this.maxSize = maxSize;
        this.pool = [];
    }
    private getConverterFuncs: ((value: any | PromiseLike<any>) => void)[] = [];
    private getConverter(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (this.pool.length < this.maxSize) {
                let converter = createChildProcess<IConverterProcess>(path.resolve(__dirname, './converter.node.js'));
                this.pool.push(converter);
                resolve({ target: converter })
            } else {
                this.getConverterFuncs.push(resolve);
            }
        });
    }
    private converterComplete(target: IConverterProcess): void {
        if (this.getConverterFuncs.length > 0) {
            var func = this.getConverterFuncs.pop();
            func({ target: target });
        }
    }

    private convert(slice: ISlice): Promise<ISlice> {
        return this.getConverter().then(target => {
            var converter = target.target as IConverterProcess;
            return converter.convert(slice).then(slice => {
                this.converterComplete(converter);
                return slice;
            });
        });
    }

    private slices: ISlice[] = [];
    private completeNum: number = 0;
    public init(): void {
        this.slices = [];
        this.completeNum = 0;
    }

    public addSlice(slice: ISlice): void {
        this.slices.push(slice);
    }

    public run(): Promise<void> {
        this.completeNum = 0;
        return new Promise<void>((resolove, reject) => {
            for (let i = 0; i < this.slices.length; i++) {
                this.convert(this.slices[i]).then(slice => {
                    this.completeNum++;
                    if (this.completeNum == this.slices.length) {
                        resolove();
                    }
                });
            }
        });
    }

    public exit(): void {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].exit();
        }
    }
}