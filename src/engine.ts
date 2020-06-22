import { IRecord, IPageMap } from './interfaces';
import * as sqlite from 'better-sqlite3';
import sha1 from 'sha1';
import { delay, logger, queryPrepare } from './utils';
import dedent from 'ts-dedent';
import * as yaml from 'yaml';
import { readFileSync } from 'fs';
import nano, { DocumentScope } from 'nano';
import { config, algorithmConfig } from './configProvider';

/**
 * @function constructRecord Constructs an IRecord Object
 * @param type "epubcfi" or "pdf", can be used to map back to origial (pdf not supported yet)
 * @param pagemapValue value of the "epubcfi" or "pdf" mapping
 * @param dataField1 original text that was highlighted
 * @param dataField2 note that was added to the original text
 * @param source describes the source of the original record
 * @param richContent map to any rich content that the record should come bundled with
 * //TODO: fix up docs
 */
export function constructRecord(
    dataField1: string,
    dataField2: string,
    source: string,
    pageMap?: IPageMap,
    configPath: string = './configuration/.refinery.yaml',
    deck: string = 'default',
    notebook?: string,
    richContent: string = ''
): IRecord {
    let now: string = Date.now().toString();
    let configObj: any = config(configPath)
    let algorithmConfigObj: any = algorithmConfig(deck, configObj);

    let record: IRecord = {
        pageMap: pageMap,
        dataField1: dataField1,
        dataField2: dataField2,
        source: source,
        richContent: richContent,
        _id: sha1(`${now}${dataField1}${dataField2}`),
        timestampCreated: Date.now(),
        timestampModified: Date.now(),
        flashcard: {
            easinessFactor: algorithmConfigObj.new.initialFactor,
            deck: deck,
            scheduler: {
                pastRevisions: new Array<number>(),
                nextRevision: Date.now()
            }
        },
        notebook: notebook
    }
    return record;
}

/**
 * @function isRecord Checks if an object is of type `IRecord`
 * @param obj object of any type
 */
export function isRecord(obj: any): obj is IRecord{
    let bools: Array<boolean> = [
        'dataField1' in obj,
        'dataField2' in obj,
        '_id' in obj,
        'timestampCreated' in obj,
        'timestampModified' in obj,
        'flashcard' in obj,
        'source' in obj
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
 * @param wrapDataField1 Format wrapper for the highlighted text
 * @param wrapDataField2 Format wrapper for the note added
 * @returns string
 */
export function convert(
    record: IRecord | Array<IRecord>,
    title: string,
    wrapTitle: [string, string],
    wrapDataField1: [string, string],
    wrapDataField2: [string, string]
){
    let serializedString: string = "";
    // callback to format output string:
    let cb = (x: IRecord, 
              prop: "dataField1" | "dataField2",
              wrapLeft: string, 
              wrapRight: string)=> {
              if (x[prop] != null){
                serializedString += `${wrapLeft}${x[prop]}${wrapRight}`
              }
    }
    serializedString += `${wrapTitle[0]}${title}${wrapTitle[1]}`;
    if (isRecord(record)){
        cb(record, "dataField1", wrapDataField1[0], wrapDataField1[1]);
        cb(record, "dataField2", wrapDataField2[0], wrapDataField2[1]);
    }
    else{
        record.forEach((x)=>{
            cb(x, "dataField1", wrapDataField1[0], wrapDataField1[1]);
            cb(x, "dataField2", wrapDataField2[0], wrapDataField2[1]);
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
 * @param cssDataField1Class CSS class bound to Highlight elements
 * @param cssDataField2Class CSS class bound to Note elements
 * @param cssTitleClass CSS class bound to the title
 * @returns string
 */
export function convertToHtml(
    record: IRecord | Array<IRecord>,
    title: string,
    cssFile: string = 'default.css',
    cssDataField1Class: string = 'highlight',
    cssDataField2Class: string = 'note',
    cssTitleClass: string = 'title'
): string{
    let htmlCore: string = `<!DOCTYPE html>\n<html>\n<head>\n  <title>${title}</title>
  <link rel="stylesheet" href="${cssFile}">\n</head>\n<body>\n`
    htmlCore += convert(record, 
        title,
        [`  <h1 class="${cssTitleClass}">`, "</h1>\n"],
        [`    <p class="${cssDataField1Class}">`, "</p>\n"],
        [`    <p class="${cssDataField2Class}">`, "</p>\n\n"]);
    htmlCore += "</body></html>"
    return htmlCore;
}

// export function convertToFlashcard(
//     record: IRecord | Array<IRecord>,
//     ankiEngine: AnkiEgressEngine,
//     // deckModel: IModel
// ): void{
//     if (isRecord(record)){
//         ankiEngine.addCard(record);
//     }
//     else{
//         for (let el of record){
//             ankiEngine.addCard(el);
//         }
//     }
// }

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
    mode: 'get' | 'run' = 'get'
): Promise<Array<any>>{
    let rows: Array<any> = new Array<any>();
    // create Promise as a placeholder for `rows`:
    let pr: Promise<Array<any>>;
    pr = new Promise<Array<any>>((resolve, reject)=>{
        try {
            if (mode == 'get'){
                let responseRows = db.prepare(sqlQuery).all()
                for (let row of responseRows){
                    rows.push(row);
                }
            }
            else if (mode == 'run'){
                db.prepare(sqlQuery).run()
            }
            
            resolve(rows);
        }
        catch(err){
            // use logger, SQL problems are hard to debug:
            logger.log({
                level: 'error', 
                message: `Error at sqlQueryHelper (pre-response): ${err.message}`
            });
            logger.log({
                level: 'silly',
                message: `Query with which sqlQueryHelper was called is: ${sqlQuery}`
            });
            reject(err.message);
        }
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
    mode: 'get' | 'run' = 'get'
): Promise<Array<any>> {
    function closeDb(db: sqlite.Database){
        try {
            db.close();
            logger.log({level: 'silly', message: 'Connection closed successfully.'});
        }
        catch(err){
            logger.log({
                level: 'error', 
                message: `Error at sqlQueryRun when closing database ${dbPath}: ${err.message}`
            });
        }
    }
    let pr: Promise<Array<any>> = new Promise((resolve, reject)=>{
        let returnVal: Array<any> = new Array<any>();
        let db: sqlite.Database = new sqlite.default(dbPath);
        sqlQueryHelper(db, sqlQuery, mode).then(
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

export function sqlSchema(dbPath: string, schema: string){
    let cleanSchema: string = queryPrepare(schema)
    let splitSchema: Array<string> = cleanSchema.split(';');
    // pop last, because we don't expect any valid query after the last `;` char:
    splitSchema.pop();
    let promiseChain: Array<Promise<any>> = new Array<Promise<any>>();
    let pr: Promise<void> = new Promise<void>(async (resolve, reject)=>{
        // put back `;` onto each element of the array with a trailing space for safety
        for (let i = 0; i<splitSchema.length; i++){
            if (splitSchema[i].length > 1){
                splitSchema[i] += '; '
                promiseChain.push(sqlQueryRun(dbPath, splitSchema[i], 'run'));
            }
        }
        async function awaitSequence(
            arrayOfPromises: Array<Promise<any>>,
        ){
            let responses = Array<any>();
            for (let i =0; i<arrayOfPromises.length; i++) {
                try {
                    responses.push(await arrayOfPromises[i]);
                    logger.log({
                        level: 'silly',
                        message: `Successful schema query: ${splitSchema[i]}`
                    });
                }
                catch(err){
                    logger.log({
                        level: 'error',
                        message: `Error ${err} while processing schema creation query: ${splitSchema[i]}`
                    });
                    reject();
                }
            }
            resolve();
            return responses;
        }
        awaitSequence(promiseChain);
    });
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
    responseArrayFromSql: Array<IRecord>
) {
    let records: Array<IRecord> = new Array<IRecord>();
    for (let rec of responseArrayFromSql){
        await new Promise(async (resolve, reject) => {
            await delay(2);
            let record: IRecord  = constructRecord(
                rec.dataField1, 
                rec.dataField2,
                rec.source,
                rec.pageMap,
                rec.configPath,
                rec.deck,
                rec.notebook,
                rec.richContent
            );
            records.push(record);
            resolve(records);
        });
    }
    return records;
};

export class RefineryDatabaseWrapper {
    config: any;
    auth: Promise<nano.DatabaseAuthResponse>;
    server: nano.DatabaseScope;
    db: DocumentScope<unknown>;

    constructor(){
        this.config = config();
        // TODO: more secure handling of the database authentication:
        const couchDb = nano(
            {url: this.config.refinery.database.databaseServer, requestDefaults: {jar:true}}
        ),
            username = this.config.refinery.database.user,
            userpass = this.config.refinery.database.password,
            server = couchDb.db,
            db = couchDb.db.use(this.config.refinery.database.databaseName);
        this.auth = couchDb.auth(username, userpass);
        this.server = server;
        this.db = db;
    }
}

