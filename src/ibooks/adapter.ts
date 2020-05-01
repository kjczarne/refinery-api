// import * as epub from 'epubjs';
// import * as puppeteer from 'puppeteer';

// let pathToBook: string = "./res/lorem_ipsum.epub";

// (async () => {
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();
//     await page.goto('https://example.com');
//     await page.screenshot({path: 'example.png'});
//     let book: epub.Book = new epub.Book(pathToBook);
//     console.log(book.spine.get(0));
//     await browser.close();
//   })();

import * as sqlite from 'sqlite3';
import { IRecord } from '../interfaces';
import { constructRecord, convertToMarkdown, convertToHtml } from '../engine';
import { readFileSync } from 'fs';
import * as yaml from 'yaml';

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

db.serialize(() => {
    db.each(
        sqlQuery, 
        // this callback processes the rows:
        (err, row) => {
            if (err) {
                console.error(err.message);
            }
            let record: IRecord = constructRecord("epubcfi", row.pagemap, row.origtext, row.note);
            records.push(record);
        },
        // this callback runs when the previous operations are finished:
        (err, count)=>{
            console.log(records);
        });
});
  
db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connection closed successfully.');
});
