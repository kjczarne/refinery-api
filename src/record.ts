import { IRecord, DataFieldType } from './interfaces';
import sha1 from 'sha1';
import { delay, logger } from './utilities/utils';

export class Record implements IRecord {
  data: DataFieldType;
  source: string;
  _id: string;
  _rev?: string;
  timestampCreated: number;
  timestampModified: number;
  pastExports: Array<number>;
  notebook?: string;
  batch: string;

  /**
   * @constructor Record
   * @param data data do be serialized as a Record in string form
   * @param source string specifying where the data is coming from
   * @param batch batch name, default is "default"
   * @param notebook notebook name, default is "default"
   */
  constructor(
    data: DataFieldType,
    source: string,
    batch: string = 'default',
    notebook: string = 'default',
  ) {
    let now: string = Date.now().toString();
    this.data = data;
    this.source = source;
    this._id = sha1(`${now}${data}`);
    this.timestampCreated = Date.now();
    this.timestampModified = Date.now();
    this.batch = batch;
    this.pastExports = new Array<number>();
    this.notebook = notebook;
  }

  /**
   * @function doc serializes the Record as a JSON document
   */
  doc(){
    return JSON.stringify(
      this
    );
  }

  /**
   * @function isRecord Checks if an object is of type `IRecord`
   * @param obj object of any type
   */
  static isRecord(obj: any): obj is IRecord{
    let bools: Array<boolean> = [
        'data' in obj,
        '_id' in obj,
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
   * @param title Title of the summary/batch
   * @param wrapTitle Format wrapper for the title
   * @param wrapData Array of tuples that specify how each data element
   * should be wrapped on the left of the data field and on the right
   * @returns string
   */
  static convert(
    record: IRecord | Array<IRecord>,
    title: string,
    wrapTitle: [string, string],
    wrapData: Array<[string, string]>,
    footer: string = "",
    wrapFooter: [string, string] = ["", ""]
  ){
    let serializedString: string = "";
    // callback to format output string:
    let cb = (x: IRecord)=> {
              if (x["data"] != null){
                for (let idx = 0; idx < x["data"].length; idx++) {
                  serializedString += `${wrapData[idx][0]}${x["data"][idx]}${wrapData[idx][1]}`
                }
              }
    }
    serializedString += `${wrapTitle[0]}${title}${wrapTitle[1]}`;
    if (Record.isRecord(record)){
        cb(record);
    }
    else{
        record.forEach((x)=>{
            cb(x);
        });
    }
    serializedString += `${wrapFooter[0]}${footer}${wrapFooter[1]}`;
    return serializedString;
  }

  invert(){} //TODO: inverse converter

  /**
  * @function constructRecords facilitates creation of IRecord objects from a SQL query response
  * @param responseArrayFromSql an Array of entries returned from a SQL query (Promise response)
  * @returns Array<IRecord>
  * Intended pattern of usage:
  * ```javascript
  * sqlQueryRun(dbPath, query).then((response)=>{
  *   Record.constructRecords(response).then((response)=>{
  *       // do what you need to records here
  *   });
  * });
  * ```
  */
  static async constructRecords(
    responseArrayFromSql: Array<IRecord>
  ) {
    let records: Array<IRecord> = new Array<IRecord>();
    for (let rec of responseArrayFromSql){
        await new Promise(async (resolve, reject) => {
            await delay(2);
            let record: IRecord  = new Record(
                rec.data,
                rec.source,
                rec.batch,
                rec.notebook
            );
            records.push(record);
            resolve(records);
        });
    }
    return records;
  };
}

export default Record;