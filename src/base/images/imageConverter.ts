import {PNG} from 'pngjs';
import { readPngFileSync,writePngFileSync } from "node-libpng";

import * as fs from 'fs';
import * as path from 'path';

/**
 * 诺瓦用的图片转换器
 */
export class ImageConverter{
    constructor(){
    }

    public convertImage(imagePath:string):void{

        var sourceImageName = path.basename(imagePath);
        var sourceDir = path.dirname(imagePath);
        var sourceIndexStr = sourceImageName.split('.')[0]
        var sourceIndex = parseInt(sourceIndexStr);
        if(sourceIndexStr != sourceIndex.toString()){
            //如果不是序列图则不继续
            return;
        }
        console.log(sourceIndex);

        var sourceData = readPngFileSync(imagePath);
        var targetWidth = Math.floor(sourceData.width/3);
        var targetHeight = Math.floor(sourceData.height);


        var targetData = Buffer.alloc(targetWidth*targetHeight*3)
        for (var y = 0; y < sourceData.height; y++) {
            var xIndex = 0;
            for (var x = 0; x < sourceData.width; x+=3) {
                var rIndex = (sourceData.width * y + x)*sourceData.channels;
                var gIndex = (sourceData.width * y + x+1)*sourceData.channels;
                var bIndex = (sourceData.width * y + x+2)*sourceData.channels;

                var rValue = sourceData.data[rIndex];
                var gValue = sourceData.data[gIndex];
                var bValue = sourceData.data[bIndex];

                var targetIdx = (targetWidth * y + xIndex)*3;
                targetData[targetIdx] = rValue;
                targetData[targetIdx+1] = gValue;
                targetData[targetIdx+2] = bValue;
                xIndex++
            }
        }
     
        var targetIndexName = (sourceIndex-1)+'';
        while(targetIndexName.length < 5){
            targetIndexName = '0'+targetIndexName;
        }
        var targetName = 'nova3d'+targetIndexName+'.png';
        var targetPath = path.join(sourceDir,targetName);

        writePngFileSync(targetPath,targetData,{width:targetWidth,height:targetHeight,compressionLevel:1});       

        // fs.unlinkSync(imagePath);  测试完了再打开
    }
}