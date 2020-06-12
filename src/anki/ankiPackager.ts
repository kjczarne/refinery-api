import { readFileSync, writeFileSync } from 'fs';
import JSZip from 'jszip';

export class AnkiPackager {
    mediaFiles: Array<Buffer>;
    mediaFileNames: Array<string>;

    private _dbPath: string;
    private _mediaMap: Map<number, string> = new Map<number, string>();
    private _outPath: string;

    constructor(dbFilePath: string, outPath: string, mediaFileNames?: Array<string>, mediaFiles?: Array<Buffer>){
        this._dbPath = dbFilePath;
        this._outPath = outPath;  // Warning: has to have a trailing slash
        if(typeof mediaFiles === 'undefined'){
            this.mediaFiles = [];
        }
        else {
            this.mediaFiles = mediaFiles;
        }
        if(typeof mediaFileNames === 'undefined'){
            this.mediaFileNames = [];
        }
        else {
            this.mediaFileNames = mediaFileNames;
        }
    }
    
    pack(): Promise<Buffer>{
        let zip: JSZip = new JSZip();
        for(let i = 0; i < this.mediaFiles.length; i++){
            // save media files under index name:
            zip.file(this._outPath+i.toString(), this.mediaFiles[i]);
            // add index-filename to the mediaMap:
            this._mediaMap.set(i, this.mediaFileNames[i]);
        }
        zip.file(this._outPath+'collection.anki2', readFileSync(this._dbPath));
        zip.file(this._outPath+'media', JSON.stringify(this._mediaMap));
        return zip.generateAsync(
            {
                type: 'nodebuffer',
                compression: 'DEFLATE'
            }
        );
    }
}