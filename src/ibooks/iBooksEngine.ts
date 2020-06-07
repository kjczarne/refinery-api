import * as sqlite from 'sqlite3';
import { IRecord } from '../interfaces';
import { constructRecord, convertToMarkdown, convertToHtml, sqlQueryRun, convertToFlashcard, constructRecords } from '../engine';
import { readFileSync, writeFileSync } from 'fs';
import * as yaml from 'yaml';
import { AnkiEgressEngine } from '../anki/ankiEgressEngine';
import { AnkiPackager } from '../anki/ankiPackager';
import { models } from '../anki/ankiObjects';
import { IPDeck } from '../anki/interfaces';
import { delay, logger, queryPrepare } from '../utils';
import { dedent } from 'ts-dedent';
import { RefineryDatabaseWrapper } from '../engine';

export class AppleiBooksEngine {
    // load in the YAML config:
    config: any;
    pathToAnnotationDb: string;
    pathToLibraryDb: string;
    recordsDb: RefineryDatabaseWrapper;

    private _sqlQuery1: string = dedent`
    SELECT 
    ZASSETID AS assetId,
    ZTITLE AS bookTitle
    FROM ZBKLIBRARYASSET;
    `.replace(/\n/g, ' ');

    // sqlQuery naming columns consistently with IRecord fields:
    private _sqlQuery2: string = dedent`
    SELECT
    ZANNOTATIONNOTE AS dataField2,
    ZANNOTATIONLOCATION AS pagemapValue,
    ZANNOTATIONSELECTEDTEXT AS dataField1,
    ZANNOTATIONASSETID AS assetId
    FROM ZAEANNOTATION;
    `.replace(/\n/g, ' ');
    constructor(configPath: string = './configuration/.refinery.yaml') {
        this.config = yaml.parse(readFileSync(configPath, 'utf8'));
        this.pathToAnnotationDb = this.config.ibooks.annotationsDb;
        this.pathToLibraryDb = this.config.ibooks.libraryDb;
        this.recordsDb = new RefineryDatabaseWrapper(configPath);
    }

    async load(bookName: string): Promise<string> {
        let pr: Promise<string> = new Promise<string>((resolve, reject)=>{
            sqlQueryRun(this.pathToLibraryDb, this._sqlQuery1).then((response1)=>{
                sqlQueryRun(this.pathToAnnotationDb, this._sqlQuery2).then((response2)=>{
                    // filter out annotations that match the title in the function signature:
                    var filteredResponse1 = response1.filter((v)=>{return v.bookTitle === bookName});
                    let filteredResponse2 = response2.filter((v)=>{return filteredResponse1.filter((v2)=>{v2.assetId === v.assetId})});
                    // add ebook type info to the response object:
                    filteredResponse2.forEach((v)=>{
                        v['pageMap']={pagemapType: 'epubcfi', pagemapValue: v.pagemapValue};
                        v['richContent']='';
                        v['source']=bookName;
                    });
                    // construct records:
                    constructRecords(filteredResponse2).then((response)=>{
                        response.forEach((v)=>{return JSON.stringify(v)});
                        this.recordsDb.auth.then(()=>{
                            this.recordsDb.db.bulk({docs: response}).then((res)=>{
                                logger.log({
                                    level: 'silly',
                                    message:
                                    `Added ${response} to RefineryDb.
                                    Response: ${res}`
                                })
                            }).catch((err)=>{
                                logger.log({
                                    level: 'error',
                                    message:
                                    `Error PUTting docs into the RefineryDb: ${err}`
                                });
                            });
                            resolve(response[0]._id);
                        }).catch((err)=>{
                            logger.log({
                                level: 'error',
                                message:
                                `Problem accessing RefineryDb: ${err}`
                            });
                            reject(err);
                        })
                    });
                });
            });
        })
        return pr;
    }
}

