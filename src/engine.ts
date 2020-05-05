import { IRecord } from './interfaces';
import * as sqlite from 'sqlite3';
import { AnkiEngine } from './anki/ankiEngine';
import sha1 from 'sha1';

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
        [`  <h1 class=${cssTitleClass}>`, "</h1>\n"],
        [`    <p class=${cssHighlightClass}>`, "</p>\n"],
        [`    <p class=${cssNoteClass}>`, "</p>\n\n"]);
    htmlCore += "</body></html>"
    return htmlCore;
}

export function convertToFlashcard(
    record: IRecord | Array<IRecord>,
    ankiEngine: AnkiEngine,
    // deck: string,
    // cssFront: string,
    // cssBack: string
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
 * afterwards.
 * @param db sqlite3.Database
 * @param sqlQuery Valid SQL query
 * @returns Promise<Array<any>>
 */
export function sqlQueryRun(
    db: sqlite.Database,
    sqlQuery: string,
    autoClose: boolean = true
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
                        // reject Promise on errors:
                        reject(err.message);
                    }
                        rows.push(row);
                },
                // this callback runs when the previous operations are finished:
                (err, count)=>{
                    if (err) {
                        reject(err.message);
                    }
                    if (autoClose){
                        // sometimes running concurrent queries makes it undesireable
                        // to automatically close the database, so we let this to be
                        // an option
                        db.close((err) => {
                            if (err) {
                                reject(err.message);
                            }
                            else {
                                console.log('Connection closed successfully.');
                            }
                        });
                    }
                    // return the value of `rows` array if the Promise is resolved:
                    resolve(rows);
            });
        });
    });
    return pr;
}