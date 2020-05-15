import { IRecord } from './interfaces';
import * as sqlite from 'sqlite3';
import { AnkiEngine } from './anki/ankiEngine';
import sha1 from 'sha1';
import { delay, logger } from './utils';
import dedent from 'ts-dedent';

/**
 * @function constructRecord Constructs an IRecord Object
 * @param type "epubcfi" or "pdf", can be used to map back to origial (pdf not supported yet)
 * @param pageMapValue value of the "epubcfi" or "pdf" mapping
 * @param origText original text that was highlighted
 * @param note note that was added to the original text
 * @param richContent map to any rich content that the record should come bundled with
 */
export function constructRecord(
    type: "epubcfi" | "pdf",
    pageMapValue: string,
    origText: string,
    note: string,
    richContent: string = ''): IRecord{
        let now: string = Date.now().valueOf().toString();
        let record: IRecord = {
            pageMap: {
                type: type,
                value: pageMapValue
            },
            origText: origText,
            note: note,
            richContent: richContent,
            guid: sha1(`${now}${origText}${note}`),
            timestampCreated: Date.now().valueOf(),
            timestampModified: Date.now().valueOf()
        }
        return record;
}

/**
 * @function isRecord Checks if an object is of type `IRecord`
 * @param obj object of any type
 */
function isRecord(obj: any): obj is IRecord{
    let bools: Array<boolean> = [
        'pageMap' in obj,
        'origText' in obj,
        'note' in obj,
        'richContent' in obj,
        'guid' in obj,
        'timestampCreated' in obj,
        'timestampModified' in obj
    ]
    let check: boolean = bools.every((x)=>{return x===true});
    return check;
}

/**
 * @function convert General function that formats strings making up
 * the title, the highlight and the note. For instance in case of HTML
 * you will want to wrap the title with <h1> and </h1>
 * @param record IRecord or an Array of IRecord objects
 * @param title Title of the summary/deck
 * @param wrapTitle Format wrapper for the title
 * @param wrapOrigText Format wrapper for the highlighted text
 * @param wrapNote Format wrapper for the note added
 * @returns string
 */
export function convert(
    record: IRecord | Array<IRecord>,
    title: string,
    wrapTitle: [string, string],
    wrapOrigText: [string, string],
    wrapNote: [string, string]
){
    let serializedString: string = "";
    // callback to format output string:
    let cb = (x: IRecord, 
              prop: "origText" | "note",
              wrapLeft: string, 
              wrapRight: string)=> {
              if (x[prop] != null){
                serializedString += `${wrapLeft}${x[prop]}${wrapRight}`
              }
    }
    serializedString += `${wrapTitle[0]}${title}${wrapTitle[1]}`;
    if (isRecord(record)){
        cb(record, "origText", wrapOrigText[0], wrapOrigText[1]);
        cb(record, "note", wrapNote[0], wrapNote[1]);
    }
    else{
        record.forEach((x)=>{
            cb(x, "origText", wrapOrigText[0], wrapOrigText[1]);
            cb(x, "note", wrapNote[0], wrapNote[1]);
        });
    }
    return serializedString;
}

/**
 * @function convertToMarkdown Converts IRecords to a Markdown
 * serialized string.
 * @param record IRecord or an Array of IRecord Objects
 * @param title Desired title of the Markdown document
 * @returns string
 */
export function convertToMarkdown(
    record: IRecord | Array<IRecord>,
    title: string
): string{
    return convert(record, 
                   title,
                   ["# ", "\n\n"],
                   ["", "\n"],
                   ["", "\n\n"]);
}

/**
 * @function convertToHtml Converts IRecords to an HTML document
 * serialized string.
 * @param record IRecord or an Array of IRecord Objects
 * @param title Desired title of the HTML Document
 * @param cssFile CSS file for styling
 * @param cssHighlightClass CSS class bound to Highlight elements
 * @param cssNoteClass CSS class bound to Note elements
 * @param cssTitleClass CSS class bound to the title
 * @returns string
 */
export function convertToHtml(
    record: IRecord | Array<IRecord>,
    title: string,
    cssFile: string = 'default.css',
    cssHighlightClass: string = 'highlight',
    cssNoteClass: string = 'note',
    cssTitleClass: string = 'title'
): string{
    let htmlCore: string = `<!DOCTYPE html>\n<html>\n<head>\n  <title>${title}</title>
  <link rel="stylesheet" href="${cssFile}">\n</head>\n<body>\n`
    htmlCore += convert(record, 
        title,
        [`  <h1 class="${cssTitleClass}">`, "</h1>\n"],
        [`    <p class="${cssHighlightClass}">`, "</p>\n"],
        [`    <p class="${cssNoteClass}">`, "</p>\n\n"]);
    htmlCore += "</body></html>"
    return htmlCore;
}

export function convertToFlashcard(
    record: IRecord | Array<IRecord>,
    ankiEngine: AnkiEngine,
    // deckModel: IModel
): void{
    if (isRecord(record)){
        ankiEngine.addCard(record);
    }
    else{
        for (let el of record){
            ankiEngine.addCard(el);
        }
    }
}

/**
 * @function sqlQuery
 * Queries a `sqlite` database and closes connection
 * afterwards. Multiple apps make liberal use of `sqlite`
 * databases, iBooks and Anki for example, thus it makes
 * sense to encapsulate the steps required for querying
 * those databases in a function that can be reused
 * across the whole platform.
 * @param db sqlite3.Database
 * @param sqlQuery Valid SQL query
 * @returns Promise<Array<any>>
 */
export function sqlQueryHelper(
    db: sqlite.Database,
    sqlQuery: string,
): Promise<Array<any>>{
    let rows: Array<any> = new Array<any>();
    // create Promise as a placeholder for `rows`:
    let pr: Promise<Array<any>>;
    pr = new Promise<Array<any>>((resolve, reject)=>{
        db.serialize(() => {
            db.each(
                sqlQuery, 
                // this callback processes the rows:
                (err, row) => {
                    if (err) {
                        // use logger, SQL problems are hard to debug:
                        logger.log({
                            level: 'error', 
                            message: `Error at sqlQueryHelper (pre-response): ${err.message}`
                        });
                        logger.log({
                            level: 'silly',
                            message: `Query with which sqlQueryHelper was called is: ${sqlQuery}`
                        });
                        // reject Promise on errors:
                        reject(err.message);
                    }
                        rows.push(row);
                },
                // this callback runs when the previous operations are finished:
                (err, count)=>{
                    if (err) {
                        logger.log({
                            level: 'error', 
                            message: `Error at sqlQueryHelper (post-response): ${err.message}`
                        });
                        logger.log({
                            level: 'silly',
                            message: dedent`
                            Query with which sqlQueryHelper was called is: ${sqlQuery}
                            Response elements number is ${count}`
                        });
                        reject(err.message);
                    }
                    // return the value of `rows` array if the Promise is resolved:
                    resolve(rows);
            });
        });
    });
    return pr;
}

/**
 * @function sqlQueryRun 
 * encapsulates sending a query to a sqlite3 database,
 * always closes connection afterwards (maximum cleanup)
 * @param dbPath path to the sqlite3 database
 * @param sqlQuery valid SQL query
 */
export function sqlQueryRun(
    dbPath: string,
    sqlQuery: string,
): Promise<Array<any>> {
    function closeDb(db: sqlite.Database){
        db.close((err) => {
            if (err) {
                logger.log({
                    level: 'error', 
                    message: `Error at sqlQueryRun when closing database ${dbPath}: ${err.message}`
                });  
            }
            else {
                logger.log({level: 'silly', message: 'Connection closed successfully.'});
            }
        });
    }
    let pr: Promise<Array<any>> = new Promise((resolve, reject)=>{
        let returnVal: Array<any> = new Array<any>();
        let db: sqlite.Database = new sqlite.Database(dbPath);
        sqlQueryHelper(db, sqlQuery).then(
            (response)=>{
                closeDb(db);
                logger.log({
                    level: 'silly', 
                    message: `Query: ${sqlQuery} has succesfully returned a response.`
                });
                resolve(response);
            }
        ).catch(
            (err)=>{
                closeDb(db);
                logger.log({
                    level: 'error', 
                    message: dedent`
                    Error at sqlQueryRun when calling helper: ${err.message}
                    The query provided was: ${sqlQuery}`
                });
                reject(err.message);
        });
    })
    return pr;
}


/**
 * @function constructRecords facilitates creation of IRecord objects from a SQL query response
 * @param responseArrayFromSql an Array of entries returned from a SQL query (Promise response)
 * @returns Array<IRecord>
 * Intended pattern of usage:
 * ```javascript
 * sqlQueryRun(dbPath, query).then((response)=>{
 *   constructRecords(response).then((response)=>{
 *       // do what you need to records here
 *   });
 * });
 * ```
 */
export async function constructRecords(
    responseArrayFromSql: Array<any>
) {
    let records: Array<IRecord> = new Array<IRecord>();
    for (let rec of responseArrayFromSql){
        await new Promise(async (resolve, reject) => {
            await delay(2);
            let record: IRecord  = constructRecord("epubcfi", rec.pagemap, rec.origtext, rec.note);
            records.push(record);
            resolve(records);
        });
    }
    return records;
};

