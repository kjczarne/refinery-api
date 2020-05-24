import { IRecord } from '../interfaces';
import { readFileSync, writeFileSync } from 'fs';
import { AnkiEgressEngine } from '../anki/ankiEgressEngine';
import { AnkiPackager } from '../anki/ankiPackager';
import { logger } from '../utils';
import { dedent } from 'ts-dedent';
import { AppleiBooksEngine } from '../ibooks/iBooksEngine';
import { iBooks2AnkiFunction } from './interfaces';

let f: iBooks2AnkiFunction = (
    bookName: string,
    deckName: string, 
    apkgPath?: string
)=>{
    let iBooksEngine: AppleiBooksEngine = new AppleiBooksEngine();
    let adapterConfig = iBooksEngine.config.refinery.adapterConfig;
    let ankiTargetDbPath: string = adapterConfig.iBooks2Anki.ankiDb;
    let ankiEngine = new AnkiEgressEngine(
        deckName, 
        readFileSync('./src/anki/ankiDbSchema.sql').toString(), 
        ankiTargetDbPath,
        adapterConfig.iBooks2Anki.deckConfig,
        adapterConfig.iBooks2Anki.algorithmConfig
    );

    iBooksEngine.load(bookName).then(()=>{
        iBooksEngine.recordsDb.db?.list().then((response: any)=>{
            for(let el of response.rows){
                if (el.source === bookName){
                    let record: IRecord = <IRecord>el.doc;
                    ankiEngine.addCard(record);
                }
            }
            ankiEngine.updateCollectionTable();
        }).then(()=>{
            if (apkgPath !== undefined){
                let ankiPackager = new AnkiPackager(ankiTargetDbPath, apkgPath);
                ankiPackager.pack().then((zipBuffer)=>{
                    writeFileSync(`${ankiEngine.deckName}.apkg`, zipBuffer, 'binary');
                    logger.log({
                        level: "info",
                        message: dedent`
                        Package has been generated: ${ankiEngine.deckName}.apkg
                        `
                    });
                }).catch((err)=>{
                    logger.log({
                        level: "error",
                        message: dedent`
                        Error creating the .apkg file: ${err}
                        `
                    });
                });
            }
            else {
                logger.log({
                    level: "info",
                    message: dedent`
                    Written to database at: ${ankiTargetDbPath}.
                    No APKG path was specified, 
                    so only the specified Anki Database was updated.
                    `
                })
            }
        }).catch((err)=>{
            logger.log({
                level: "error",
                message: `Error ${err} while fetching from Refinery Database`
            });
        });
    }).catch((err)=>{
        logger.log({
            level: "error",
            message: `Error loading book data into Refinery Database: ${err}`
        })
    });
    
}

export default f;