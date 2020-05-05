export interface IRecord {
    pageMap: {
        type: "epubcfi" | "pdf"
        value: string
    },
    origText: string
    note: string
    richContent: string,
    guid: string,
    timestampCreated: number,
    timestampModified: number
}