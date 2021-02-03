import { GCodeHeader,GCodeLayer } from './runGCodeParser';

/**
 * GCode生成器
 */
export class GCodeGenerator {
    constructor(){
    }

    private _content:string;

    /**
     * 编译完成的GCode代码
     */
    public get content():string{
        return this._content;
    }

    private header:GCodeHeader;
    private start:string;
    private layers:GCodeLayer[];
    public build(header:GCodeHeader,start:string,layers:GCodeLayer[]):void{
        this._content = ``;
        this.header = header;
        this.start = start;
        this.layers = layers;

        this.buildHeader();
        this.buildStart();
        this.buildLayers();
        this.buildLastLayers();
        this.buildLast();
    } 

    private buildHeader():void{
        this._content += `; create by plugin (Nova3d Nodejs-TS):1.0.0\n`;
        this._content += `;(****Build and Slicing Parameters****)\n`;
        this._content += `;(X Resolution            = ${this.header.resolutionX} )\n`;
        this._content += `;(Y Resolution            = ${this.header.resolutionY} )\n`;
        this._content += `;(Layer Thickness         = ${this.header.layerHeight} mm )\n`;
        this._content += `;(Layer Time              = ${this.header.normalExposureTime*1000} ms )\n`;
        this._content += `;(Render Outlines         = False\n`;
        this._content += `;(Outline Width Inset     = 2\n`;
        this._content += `;(Outline Width Outset    = 0\n`;
        this._content += `;(Bottom Layers Time      = ${this.header.bottomLayerExposureTime} ms )\n`;
        this._content += `;(Number of Bottom Layers = ${this.header.bottomLayerCount} )\n`;
        this._content += `;(Blanking Layer Time     = 0 ms )\n`;
        this._content += `;(Build Direction         = Bottom_Up)\n`;
        this._content += `;(Lift Distance           = 5 mm )\n`;
        this._content += `;(Slide/Tilt Value        = 0)\n`;
        this._content += `;(Use Mainlift GCode Tab  = False)\n`;
        this._content += `;(Wait After Stop         = ${this.header.lightOffTime}s )\n`;
        this._content += `;(Z Lift Feed Rate        = ${this.header.normalLayerLiftSpeed} mm/s )\n`;
        this._content += `;(Z Bottom Lift Feed Rate = ${this.header.bottomLayerLiftSpeed} mm/s )\n`;
        this._content += `;(Z Lift Retract Rate     = ${this.header.normalDropSpeed} mm/s )\n`;
        this._content += `;(Flip X                  = True)\n`;
        this._content += `;(Flip Y                  = True)\n`;
        this._content += `;Number of Slices         = ${this.header.totalLayer}\n`;
        this._content += `;(****Machine Configuration ******)\n`;
        this._content += `;(Platform X Size         = ${this.header.machineX}mm )\n`;
        this._content += `;(Platform Y Size         = ${this.header.machineY}mm )\n`;
        this._content += `;(Platform Z Size         = ${this.header.machineZ}mm )\n`;
        this._content += `;(Max X Feedrate          = 240mm/s )\n`;
        this._content += `;(Max Y Feedrate          = 240mm/s )\n`;
        this._content += `;(Max Z Feedrate          = 240mm/s )\n`;
        this._content += `;(Machine Type            = UV_LCD)\n`;
    }

    private buildStart():void{
        this._content+=`\n`;
        this._content+=`G28\n`;
        this._content+=`G21 ;Set units to be mm\n`;
        this._content+=`G91 ;Relative Positioning\n`;
        this._content+=`M17 ;Enable motors\n`;
        this._content+=`<Slice> Blank\n`;
        this._content+=`M106 S0\n`;
    }

    private buildLayers():void{
        this.analyseLayers();
        for(var i = 0;i<this.layers.length;i++){
            this.buildLayer(this.layers[i]);
        }
    }

    private transitionLayerStartIndex = 0;  //过度层的开始索引
    private transitionLayerEndIndex = 0;    //过度层的结束索引
    private analyseSuccess:boolean = false;

    private startRiseSpeed:number = -1;
    private endRiseSpeed:number = -1;

    private startRiseDist:number = -1;
    private endRiseDist:number = -1;

    private startFallSpeed:number = -1;
    private endFallSpeed:number = -1;

    private startlightDelay:number = -1;
    private endLightDelay:number = -1;

    private startExposureTime:number = -1;
    private endExposureTime:number = -1;
    private analyseLayers():void{
        this.analyseSuccess = false;
        this.transitionLayerStartIndex = parseInt(this.header.bottomLayerCount as any);
        for(var i = this.transitionLayerStartIndex;i<this.layers.length-1;i++){
            var curLayer = this.layers[i];
            var nextLayer = this.layers[i+1];
            if(curLayer.exposure_time == nextLayer.exposure_time){
                this.transitionLayerEndIndex = i-1;
                break;
            }
        }
        if(this.transitionLayerStartIndex > 0 && this.transitionLayerEndIndex > this.transitionLayerStartIndex && this.transitionLayerEndIndex < this.layers.length-1){
            var startLayer:GCodeLayer = null;
            var endLayer:GCodeLayer = null;
            try {
                startLayer = this.layers[this.transitionLayerStartIndex-1];
                endLayer = this.layers[this.transitionLayerEndIndex+1];
            } catch (error) {}
            if(startLayer && endLayer){
                this.analyseSuccess = true;
                this.startRiseSpeed = startLayer.rise_speed;
                this.endRiseSpeed = endLayer.rise_speed;
    
                this.startFallSpeed = startLayer.fall_speed;
                this.endFallSpeed = endLayer.fall_speed;

                this.startlightDelay = startLayer.light_delay;
                this.endLightDelay = endLayer.light_delay;

                this.startExposureTime = startLayer.exposure_time;
                this.endExposureTime = endLayer.exposure_time;

                this.startRiseDist = startLayer.rise_pos-startLayer.fall_pos;
                this.endRiseDist = endLayer.rise_pos-endLayer.fall_pos;
            }
        }
    }

    private getTransitionValue(startValue:number,endValue:number,index:number):number{
        var numSteps =  (this.transitionLayerEndIndex+1)-(this.transitionLayerStartIndex-1);
        var valuePerStep = (endValue-startValue)/numSteps;
        var curStep = index-(this.transitionLayerStartIndex-1);
        var resultValue = startValue+valuePerStep*curStep;
        resultValue = Math.floor(resultValue*10)/10;
        return resultValue;
    }


    private buildLayer(layer:GCodeLayer):void{
        this._content+=`\n`;
        this._content+=`;<Slice> ${layer.index}\n`;
        this._content+=`M106 S${layer.light_pwm}\n`;

        var exposure_time = 0;
        if(this.analyseSuccess && layer.index >= this.transitionLayerStartIndex && layer.index <= this.transitionLayerEndIndex){
            exposure_time = this.getTransitionValue(this.startExposureTime,this.endExposureTime,layer.index);
        }else{
            exposure_time = layer.exposure_time;
        }
        this._content+=`;<Delay> ${exposure_time}\n`;
        this._content+=`M106 S0\n`;
        this._content+=`;<Slice> Blank\n`;

        var riseDist = 0;
        if(this.analyseSuccess && layer.index >= this.transitionLayerStartIndex && layer.index <= this.transitionLayerEndIndex){
            riseDist = this.getTransitionValue(this.startRiseDist,this.endRiseDist,layer.index);
        }else{
            riseDist = layer.rise_pos - layer.fall_pos;
        }
        var fallDist = parseFloat(this.header.layerHeight as any)-riseDist;

        riseDist = Math.ceil(riseDist*10000000)/10000000;
        fallDist = Math.ceil(fallDist*10000000)/10000000;

        var riseSpeed = 0;
        var fallSpeed = 0;

        if(this.analyseSuccess && layer.index >= this.transitionLayerStartIndex && layer.index <= this.transitionLayerEndIndex){
            riseSpeed = this.getTransitionValue(this.startRiseSpeed,this.endRiseSpeed,layer.index);
            fallSpeed = this.getTransitionValue(this.startFallSpeed,this.endFallSpeed,layer.index);
        }else{
            riseSpeed = layer.rise_speed;
            fallSpeed = layer.fall_speed;
        }

        this._content+=`G1 Z${riseDist} F${riseSpeed}\n`;
        this._content+=`G1 Z${fallDist} F${fallSpeed}\n`;

        var sumDelay = 0;
        var lightDelay = 0;
        if(this.analyseSuccess && layer.index >= this.transitionLayerStartIndex && layer.index <= this.transitionLayerEndIndex){
            lightDelay = this.getTransitionValue(this.startlightDelay,this.endLightDelay,layer.index);
        }else{
            lightDelay = layer.light_delay;
        }

        var riseDelay = riseDist/(riseSpeed/60)*1000;
        var fallDelay = (-fallDist)/(fallSpeed/60)*1000;
        sumDelay = riseDelay+fallDelay+lightDelay;
        sumDelay = Math.floor(sumDelay);
        this._content+=`;<Delay> ${sumDelay}\n`;
    }


    private buildLastLayers():void{
        var numLastLayers = parseInt(this.header.totalLayer as any)-this.layers.length;
        var lastLayerCopy = {} as GCodeLayer;
        var lastLayer = this.layers[this.layers.length-1];
        lastLayerCopy.index = lastLayer.index;
        lastLayerCopy.rise_pos = lastLayer.rise_pos;
        lastLayerCopy.rise_speed = lastLayer.rise_speed;
        lastLayerCopy.fall_pos = lastLayer.fall_pos;
        lastLayerCopy.fall_speed = lastLayer.fall_speed;
        lastLayerCopy.light_delay = lastLayer.light_delay;
        lastLayerCopy.light_pwm = lastLayer.light_pwm;
        lastLayerCopy.exposure_time = lastLayer.exposure_time;

        for(var i = 0;i<numLastLayers;i++){
            lastLayerCopy.index++;
            this.buildLayer(lastLayerCopy);
        }
    }

    private buildLast():void{
        this._content+=`\n`;
        this._content+=`M18 ;Disable Motors\n`;
        this._content+=`M106 S0\n`;
        this._content+=`G1 Z80\n`;
        this._content+=`;<Completed>\n`;
    }
}