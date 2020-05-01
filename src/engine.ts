import { IRecord } from './interfaces';

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