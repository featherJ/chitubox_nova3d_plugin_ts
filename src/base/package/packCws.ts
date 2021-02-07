var zipper = require('zip-local');

export class PackCws{
    constructor(){

    }

    public pack(sourcePath:string,targetPath:string):void{
        zipper.sync.zip(sourcePath).save(targetPath);
    }
}