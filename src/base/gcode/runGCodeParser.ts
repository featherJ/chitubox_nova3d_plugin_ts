import * as fss from 'fs';

export interface GCodeHeader {
    fileName: string;
    machineType: string;
    estimatedPrintTime: string;
    volume: number;
    resin: string;
    weight: number;
    price: number;
    layerHeight: number;
    resolutionX: number;
    resolutionY: number;
    machineX: number;
    machineY: number
    machineZ: number;
    projectType: string;
    normalExposureTime: number;
    bottomLayExposureTime: number;
    bottomLayerExposureTime: number;
    normalDropSpeed: number;
    normalLayerLiftHeight: number;
    zSlowUpDistance: number;
    normalLayerLiftSpeed: number;
    bottomLayCount: number;
    bottomLayerCount: number;
    mirror: number;
    totalLayer: number;
    bottomLayerLiftHeight: number;
    bottomLayerLiftSpeed: number;
    bottomLightOffTime: number;
    lightOffTime: number;
}

export interface GCodeLayer {
    index:number;
    rise_pos:number;
    rise_speed:number;
    fall_pos:number;
    fall_speed:number;
    light_delay:number;
    light_pwm:number;
    exposure_time:number;
}

/**
 * 原始GCode的解析器
 */
export class RunGCodeParser {

    private _header:GCodeHeader;
    private _start:string;
    private _layers:GCodeLayer[];
    /**
     * 原始GCode的头部配置
     */
    public get header():GCodeHeader{
        return this._header;
    }

    /**
     * 原始GCode的起始信息
     */
    public get start():string{
        return this._start;
    }

    /**
     * 原始GCode的图层信息
     */
    public get layers():GCodeLayer[]{
        return this._layers;
    }



    constructor() {
    }

    public parse(path: string): void {
        let gcodeFile = fss.readFileSync(path, 'utf8');
        let contents = gcodeFile.split(';START_GCODE_BEGIN');
        let headerContent:string = contents[0];
        let nextContents = contents[1].split(';START_GCODE_END');
        let startContent:string = nextContents[0];
        let layerContent:string = nextContents[1];
        this.parseHeader(headerContent);
        this._start = startContent.trim();
        this.parseLayers(layerContent);
    }

    private parseHeader(headerContent: string): void {
        let tempArgs:string[] = headerContent.split(';');
        this._header = {} as GCodeHeader;
        for(let i = 0;i<tempArgs.length;i++){
            let tempArg = tempArgs[i];
            tempArg = tempArg.trim();
            if(tempArg){
                let argArr = tempArg.split(':');
                let argN = argArr[0];
                let argV = argArr[1];
                if(argN == 'fileName'){
                    argV = argV.split('#')[0];
                    argV = argV.trim();
                }
                this._header[argN] = argV;
            }
        }
    }

    private parseLayers(layersContent:string):void{
        let layers:GCodeLayer[] = [];

        let layersContents = layersContent.split(';LAYER_END');
        for(let i = 0;i<layersContents.length;i++){
            let curContent = layersContents[i];
            curContent = curContent.trim();
            if(curContent){
                if(curContent.indexOf(';END_GCODE_BEGIN') != -1){
                    break;
                }
                if(curContent.indexOf(';END_GCODE_END') != -1){
                    break;
                }
                let gDataStrs:string[] = [];
                let layerData = {} as GCodeLayer;
                let lines = curContent.split('\n');
                let lightOn = false;
                for(let j = 0;j<lines.length;j++){
                    let curLine = lines[j].trim();
                    if(curLine.indexOf(';LAYER_START:') == 0){
                        let indexValue = curLine.slice(';LAYER_START:'.length);
                        layerData.index = parseInt(indexValue);
                    }
                    if(curLine.indexOf('G0') == 0){
                        gDataStrs.push(curLine);
                    }
                    if(curLine.indexOf('G4 P') == 0){
                        let value = parseFloat(curLine.slice('G4 P'.length));
                        if(lightOn){
                            layerData.exposure_time = value;
                        }else{
                            layerData.light_delay = value;
                        }
                    }
                    if(curLine.indexOf('light on') != -1){
                        lightOn = true;
                        let tempStr = curLine.split(';')[0];
                        let value = parseFloat(tempStr.slice('M106 S'.length));
                        layerData.light_pwm = value;
                    }
                }
                let gData1 = this.parseGData(gDataStrs[0]);
                let gData2 = this.parseGData(gDataStrs[1]);
                let riseData = null;
                let fallData = null;
                if(gData1.pos >= gData2.pos){
                    riseData = gData1;
                    fallData = gData2;
                }else{
                    riseData = gData2;
                    fallData = gData1;
                }
                layerData.rise_pos = riseData.pos;
                layerData.rise_speed = riseData.speed;
                layerData.fall_pos = fallData.pos;
                layerData.fall_speed = fallData.speed;
                layers.push(layerData);
            }
        }
        this._layers = layers;
    }


    private parseGData(str:string):{pos:number,speed:number}{
       let args = str.split(' ');
        let pos = parseFloat(args[1].slice(1));
        let speed = parseFloat(args[2].slice(1));
        return {pos,speed};
    }
}