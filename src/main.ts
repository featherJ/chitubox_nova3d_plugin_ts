import { RunGCodeParser } from './base/gcode/runGCodeParser';
import { GCodeGenerator } from './base/gcode/gCodeGenerator';
import { ConverterPool } from './base/images/converterPool';

import * as path from 'path';
import * as fs from 'fs';




/**
 * nova3D插件
 */
export class Nova3DPlugin {

	private gCodeParser: RunGCodeParser;
	private gCodeGenerator: GCodeGenerator;
	private tempPath: string;
	constructor(zipTmpDir: string) {
		this.tempPath = zipTmpDir;
		this.gCodeParser = new RunGCodeParser();
		this.gCodeGenerator = new GCodeGenerator();

		try {
			this.buildGCode();
			this.buildImages();
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

	private buildImages(): void {
		var converterPool = new ConverterPool(4);
		converterPool.init();
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
					converterPool.addSlice({
						path: filePath,
						index: sourceIndex
					});
				}
			}
		}
		var stamp = new Date().getTime();
		converterPool.run().then(() => {
			converterPool.exit();
			console.log(`所有图片转换完成: ${new Date().getTime() - stamp}ms`);
		});
	}
}


let args = process.argv.splice(2);
let zipTmpDir = args[0];
if (zipTmpDir) {
	new Nova3DPlugin(zipTmpDir);
}