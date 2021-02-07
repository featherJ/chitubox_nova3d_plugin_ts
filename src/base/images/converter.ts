import { INodeProcess } from "../core/ipc/ipc.cp";
import { ISlice } from "./core/slice";

/**
 * 图片转换进程
 * @author featherJ
 */
export interface IConverterProcess extends INodeProcess {
    convert(slice:ISlice):Promise<ISlice>
}