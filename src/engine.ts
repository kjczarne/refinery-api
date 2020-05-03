import { IRecord } from './interfaces';
import * as sqlite from 'sqlite3';

export function constructRecord(
    type: "epubcfi" | "pdf",
    pageMapValue: string,
    origText: string,
    note: string,
    richContent: string = ''): IRecord{
        let record: IRecord = {
            pageMap: {
                type: type,
                value: pageMapValue
            },
            origText: origText,
            note: note,
            richContent: richContent
        }
        return record;
}

function isRecord(obj: any): obj is IRecord{
    let bools: Array<boolean> = [
        'pageMap' in obj,
        'origText' in obj,
        'note' in obj,
        'richContent' in obj
    ]
    let check: boolean = bools.every((x)=>{return x===true});
    return check;
}

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
    deck: string,
    cssFront: string,
    cssBack: string
): string{
    return convert(record, 
        "PLACEHOLDER",
        ["PLACEHOLDER", "PLACEHOLDER\n\n"],
        ["PLACEHOLDER", "PLACEHOLDER\n\n"],
        ["PLACEHOLDER", "PLACEHOLDER\n\n"]);
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
                    db.close((err) => {
                        if (err) {
                            reject(err.message);
                        }
                        else {
                            console.log('Connection closed successfully.');
                        }
                    });
                    // return the value of `rows` array if the Promise is resolved:
                    resolve(rows);
            });
        });
    });
    return pr;
}