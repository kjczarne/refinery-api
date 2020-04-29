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