/**
 * @interface IRecord
 * describes main piece of data thet is going to be handled by Refinery.
 * 
 * Modifiable elements are marked in comments.
 * This interface declares a string indexer and accepts
 * any additional properties in case existing fields do not
 * present enough context for additional data.
 * 
 * It is encouraged to add non-programatic data with names starting
 * with `dataField3` indexing upwards
 */
export interface IRecord {
    [x: string]: any,
    dataField1: string,
    dataField2: string,
    guid: string,
    richContent: string,
    timestampCreated: number,
    timestampModified: number,
    pageMap?: {
        type: "epubcfi" | "pdf"  // modifiable, can allow additional types
        value: string
    }
}