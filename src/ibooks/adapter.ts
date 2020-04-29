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
import { constructRecord } from '../utils';

let pathToDb: string = '/Users/kjczarne/Library/Containers/com.apple.iBooksX/Data/Documents/AEAnnotation/';
let fileName: string = 'AEAnnotation_v10312011_1727_local.sqlite';
let fullPath: string = pathToDb + fileName;

let db = new sqlite.Database(fullPath, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the iBooks Annotations database.');
});

let notes: Array<IRecord> = [];

let sqlQuery: string = `
SELECT
ZANNOTATIONNOTE AS note,
ZANNOTATIONLOCATION AS pagemap,
ZANNOTATIONREPRESENTATIVETEXT AS origtext
FROM ZAEANNOTATION
`

// This code is run async:
db.serialize(() => {
    db.each(sqlQuery, (err, row) => {
        if (err) {
            console.error(err.message);
        }
        let record: IRecord = constructRecord("epubcfi", row.pagemap, row.origtext, row.note);
        notes.push(record);
        console.log(record);
    });
    
});
  
db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connection closed successfully.');
});


