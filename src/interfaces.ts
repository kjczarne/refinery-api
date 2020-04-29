export interface IRecord {
    pageMap: {
        type: "epubcfi" | "pdf"
        value: string
    },
    origText: string
    note: string
    richContent: string
}