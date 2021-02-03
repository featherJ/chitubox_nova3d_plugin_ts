import {PNG} from 'pngjs';

import * as fs from 'fs';
import * as path from 'path';

/**
 * 诺瓦用的图片转换器
 */
export class ImageConverter{
    constructor(){
    }


    public convertImage(imagePath:string):void{
        var fileData = fs.readFileSync(imagePath);
        var pngData = PNG.sync.read(fileData);
        var targetWidth = Math.floor(pngData.width/3);
        var targetHeight = Math.floor(pngData.height)
        var targetPng = new PNG({width:targetWidth,height:targetHeight,filterType: -1});
        for (var y = 0; y < pngData.height; y++) {
            var xIndex = 0;
            for (var x = 0; x < pngData.width; x+=3) {
                var rIndex = (pngData.width * y + x) << 2;
                var gIndex = (pngData.width * y + x+1) << 2;
                var bIndex = (pngData.width * y + x+2) << 2;

                var rValue = pngData.data[rIndex];
                var gValue = pngData.data[gIndex];
                var bValue = pngData.data[bIndex];

                var targetIdx = (targetPng.width * y + xIndex) << 2;
                targetPng.data[targetIdx] = rValue;
                targetPng.data[targetIdx+1] = gValue;
                targetPng.data[targetIdx+2] = bValue;


                targetPng.data[targetIdx+3] = 255;
                xIndex++
            }
        }
        var sourceImageName = path.basename(imagePath);
        var sourceDir = path.dirname(imagePath);
        var sourceIndex = parseInt(sourceImageName.split('.')[0]);
        var targetIndexName = (sourceIndex-1)+'';
        while(targetIndexName.length < 5){
            targetIndexName = '0'+targetIndexName;
        }
        var targetName = 'nova3d'+targetIndexName+'.png';
        var targetPath = path.join(sourceDir,targetName);
        fs.writeFileSync(targetPath,PNG.sync.write(targetPng,{inputHasAlpha:false}));
        fs.unlinkSync(imagePath);
    }
}