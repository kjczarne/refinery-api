import * as sqlite from 'sqlite3';
import { IRecord } from '../interfaces';
import { constructRecord, convertToMarkdown, convertToHtml, sqlQueryRun, convertToFlashcard, constructRecords } from '../engine';
import { readFileSync, writeFileSync } from 'fs';
import * as yaml from 'yaml';
import { AnkiEgressEngine } from '../anki/ankiEgressEngine';
import { AnkiPackager } from '../anki/ankiPackager';
import { models } from '../anki/ankiObjects';
import { IPDeck } from '../anki/interfaces';
import { delay, logger } from '../utils';
import { dedent } from 'ts-dedent';

let envFile: string = readFileSync('./src/ibooks/env.yaml', 'utf8');
let envObj: any = yaml.parse(envFile);

let pathToDb: string = envObj.ibooks.db_dir;
let fileName: string = envObj.ibooks.db_file;
let fullPath: string = pathToDb + fileName;



let sqlQuery: string = `
SELECT
ZANNOTATIONNOTE AS note,
ZANNOTATIONLOCATION AS pagemap,
ZANNOTATIONSELECTEDTEXT AS origtext
FROM ZAEANNOTATION
`

let x = sqlQueryRun(fullPath, sqlQuery);

let db2Path: string = 'sranki.sqlite';
let schema: string = readFileSync('./src/anki/ankiDbSchema.sql').toString()
let now: number = Date.now().valueOf();
let deck: IPDeck = {
    desc: "Insert Deck Description Here",
    name: "New Deck",
    extendRev: 10,
    usn: -1,
    collapsed: false,
    newToday: [545, 0],  //TODO: should be handled by the engine (unchanged if found)
    timeToday: [545, 0],  // TODO: should be handled by the engine (unchanged if found)
    dyn: 0, // TODO: should be handled by the engine (unchanged if found)
    extendNew: 10,
    conf: 1,  // maps to DConf key
    revToday: [545, 0], // TODO: should be handled by the engine (unchanged if found)
    lrnToday: [545, 0], // TODO: should be handled by the engine (unchanged if found)
    id: now,  // deck ID
    mod: now
}
let ankiEngine = new AnkiEgressEngine('heck_deck', deck, schema, db2Path, models);
let ankiPackager = new AnkiPackager(db2Path, '');

x.then((response)=>{
    constructRecords(response).then((response)=>{
        for(let record of response){
            ankiEngine.addCard(record);
        }
        ankiEngine.updateCollectionTable();
    })
}).then(()=>{
    ankiPackager.pack().then((zipBuffer) => {
        writeFileSync(`${ankiEngine.deckName}.apkg`, zipBuffer, 'binary');
        logger.log({
            level: "silly",
            message: dedent`
            Package has been generated: ${ankiEngine.deckName}.apkg
            `
        });
    }).catch((err) => {
        logger.log({
            level: "error",
            message: dedent`
            Error creating the .apkg file: ${err}
            `
        });
    });
})
