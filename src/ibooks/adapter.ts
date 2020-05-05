import * as sqlite from 'sqlite3';
import { IRecord } from '../interfaces';
import { constructRecord, convertToMarkdown, convertToHtml, sqlQueryRun, convertToFlashcard } from '../engine';
import { readFileSync } from 'fs';
import * as yaml from 'yaml';
import { AnkiEngine } from '../anki/ankiEngine';
import { models } from '../anki/ankiObjects';

let envFile: string = readFileSync('./src/ibooks/env.yaml', 'utf8');
let envObj: any = yaml.parse(envFile);

let pathToDb: string = envObj.ibooks.db_dir;
let fileName: string = envObj.ibooks.db_file;
let fullPath: string = pathToDb + fileName;

let db = new sqlite.Database(fullPath, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the iBooks Annotations database.');
});

let records: Array<IRecord> = [];

let sqlQuery: string = `
SELECT
ZANNOTATIONNOTE AS note,
ZANNOTATIONLOCATION AS pagemap,
ZANNOTATIONSELECTEDTEXT AS origtext
FROM ZAEANNOTATION
`

let x = sqlQueryRun(db, sqlQuery);




let db2: sqlite.Database = new sqlite.Database('sranki.sqlite');
let schema: Array<string> = readFileSync('./src/anki/ankiDbSchema.sql').toString().split(';\n');
for (let i = 0; i<schema.length; i++){
    schema[i] += ';'
}
let now: number = Date.now().valueOf();
let exporter = new AnkiEngine('heck_deck', now, schema, db2, models);

x.then((response) => {
    for (let rec of response){
        let record: IRecord = constructRecord("epubcfi", rec.pagemap, rec.origtext, rec.note);
        convertToFlashcard(record, exporter);
        records.push(record);
    }
    // console.log(records);
    db.close((err)=>{console.log(err?.message)});
});