import { RunGCodeParser } from './base/gcode/runGCodeParser';
import { GCodeGenerator } from './base/gcode/gCodeGenerator';
import { ISlice } from './base/images/slice';
import { ImageConverter } from './base/images/imageConverter';
import { PackCws } from './base/package/packCws';

import * as path from 'path';
import * as fs from 'fs';

/**
 * nova3D插件
 */
export class Nova3DPlugin {

	private gCodeParser: RunGCodeParser;
	private gCodeGenerator: GCodeGenerator;
	private converter: ImageConverter;
	private packer:PackCws;
	private tempPath: string;
	constructor(zipTmpDir: string, convertSlice: boolean, outputPath:string) {
		this.tempPath = zipTmpDir;
		this.gCodeParser = new RunGCodeParser();
		this.gCodeGenerator = new GCodeGenerator();
		this.converter = new ImageConverter();
		this.packer = new PackCws();
		try {
			this.buildGCode();
			this.buildImages(convertSlice);
			this.packer.pack(zipTmpDir,outputPath);
			// fs.unlinkSync(zipTmpDir);
		} catch (e) {
			fs.writeFileSync(path.join(zipTmpDir, 'error.log'), e.stack, 'utf8');
		}
	}

	private buildGCode(): void {
		var gcodePath = path.join(this.tempPath, 'run.gcode');
		this.gCodeParser.parse(gcodePath);
		this.gCodeGenerator.build(this.gCodeParser.header, this.gCodeParser.start, this.gCodeParser.layers);
		fs.unlinkSync(gcodePath);
		var targetGCodePath = path.join(this.tempPath, 'nova3d.gcode');
		fs.writeFileSync(targetGCodePath, this.gCodeGenerator.content, 'utf8');
	}

	private buildImages(convertImage: boolean): void {
		var stamp = new Date().getTime();

		var slices: ISlice[] = [];
		var files = fs.readdirSync(this.tempPath);
		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			var filePath = path.join(this.tempPath, file);
			var ext = path.extname(filePath);
			if (ext.toLocaleLowerCase() == '.png' && file.indexOf('preview') == -1) {
				var sourceImageName = path.basename(filePath);
				var sourceIndexStr = sourceImageName.split('.')[0]
				var sourceIndex = parseInt(sourceIndexStr);
				if (sourceIndexStr == sourceIndex.toString()) {
					slices.push({
						path: filePath,
						index: sourceIndex
					});
				}
			}
		}
		for (var i = 0; i < slices.length; i++) {
			this.converter.convertImage(slices[i], convertImage);
		}
		console.log(`所有图片转换完成: ${new Date().getTime() - stamp}ms`);
	}
}


var zipTmpDir = process.argv[process.argv.length-2];
var outputPath = process.argv[process.argv.length-1];
var exts = path.extname(outputPath);
var needConvertSlice = false;
if (exts.indexOf('cws_color') == -1) {
	needConvertSlice = true;
}
var finalOutputPath = outputPath.slice(0,outputPath.length-exts.length);
finalOutputPath = finalOutputPath+'.cws';

if (zipTmpDir && outputPath) {
	new Nova3DPlugin(zipTmpDir, needConvertSlice,finalOutputPath);
}
