import { RunGCodeParser } from './base/gcode/runGCodeParser';
import { GCodeGenerator } from './base/gcode/gCodeGenerator';

import * as path from 'path';
import * as fs from 'fs';
import { ImageConverter } from './base/images/imageConverter';

/**
 * nova3D插件
 */
export class Nova3DPlugin {

	private gCodeParser:RunGCodeParser;
	private gCodeGenerator:GCodeGenerator;
	private imageConverter:ImageConverter;
	private tempPath:string;
	constructor(zipTmpDir: string) {
		this.tempPath = zipTmpDir;
		this.gCodeParser = new RunGCodeParser();
		this.gCodeGenerator = new GCodeGenerator();
		this.imageConverter = new ImageConverter();

		// try {
			// this.buildGCode();
			this.buildImages();
		// } catch (e) {
			// fs.writeFileSync(path.join(zipTmpDir,'error.log'),e.stack,'utf8');
		// }
	}

	private buildGCode():void{
		var gcodePath = path.join(this.tempPath,'run.gcode');
		this.gCodeParser.parse(gcodePath);
		this.gCodeGenerator.build(this.gCodeParser.header,this.gCodeParser.start,this.gCodeParser.layers);
		fs.unlinkSync(gcodePath);
		var targetGCodePath = path.join(this.tempPath,'nova3d.gcode');
		fs.writeFileSync(targetGCodePath,this.gCodeGenerator.content,'utf8');
	}

	private buildImages():void{
		var stamp = new Date().getTime();
		var slicePaths:string[] = [];
		var files = fs.readdirSync(this.tempPath);
		for(var i = 0;i<files.length;i++){
			var file = files[i];
			var filePath = path.join(this.tempPath,file);
			var ext = path.extname(filePath);
			if(ext.toLocaleLowerCase() == '.png' && file.indexOf('preview') == -1){
				slicePaths.push(filePath);
			}
		}
		for(var i = 0;i<slicePaths.length;i++){
			this.imageConverter.convertImage(slicePaths[i]);
		}
		console.log('图片处理时间:',(new Date().getTime()-stamp)+'ms');
	}
}


let args = process.argv.splice(2);
let zipTmpDir = args[0];
if (zipTmpDir) {
	new Nova3DPlugin(zipTmpDir);
}