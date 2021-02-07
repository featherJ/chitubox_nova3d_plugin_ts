import { NodeProcess } from "../core/ipc/ipc.cp";
import { IConverterProcess } from "./converter";
import { ImageConverter } from "./core/imageConverterCore";
import { ISlice } from "./core/slice";

/**
 * 图片转换进程
 */
export class ConverterProcess extends NodeProcess implements IConverterProcess {
    private _imageConverter:ImageConverter = null;
    constructor(){
        super();
        this._imageConverter = new ImageConverter(); 
    }

    /**
     * 转换
     * @param slice 
     */
    public convert(slice: ISlice): Promise<ISlice> {
        return new Promise<ISlice>((reslove, reject) => {
            try {
                this._imageConverter.convertImage(slice);
                reslove(slice);
            } catch (error) {
                reject(error);
            }
        });
    }
}
new ConverterProcess();