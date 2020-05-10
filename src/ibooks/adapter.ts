import * as sqlite from 'sqlite3';
import { IRecord } from '../interfaces';
import { constructRecord, convertToMarkdown, convertToHtml, sqlQueryRun, convertToFlashcard, constructRecords } from '../engine';
import { readFileSync, writeFileSync } from 'fs';
import * as yaml from 'yaml';
import { AnkiEngine } from '../anki/ankiEngine';
import { AnkiPackager } from '../anki/ankiPackager';
import { models } from '../anki/ankiObjects';
import { delay } from '../utils';

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
let ankiEngine = new AnkiEngine('heck_deck', now, schema, db2Path, models);
let ankiPackager = new AnkiPackager(db2Path, '');

x.then((response)=>{
    constructRecords(response).then((response)=>{
        for(let record of response){
            ankiEngine.addCard(record);
        }
    })
}).then(()=>{
    ankiPackager.pack().then((zipBuffer) => {
        writeFileSync(`${ankiEngine.deckName}.apkg`, zipBuffer, 'binary');
        console.log(`Package has been generated: ${ankiEngine.deckName}.apkg`);
      })
      .catch((err) => {`Error: console.log(${err.message})`});
})
