import { RefineryDatabaseWrapper } from '../engine';
import { config, DEFAULT_CONFIG_PATH } from '../configProvider';
import { IRecord } from '../interfaces';
import { logger } from '../utils';
import { create, map } from 'lodash';

/**
 * @class BaseHandler base class for the handler classes
 */
export class BaseHandler {
  configPath: string;
  config: any;
  recordsDb: RefineryDatabaseWrapper;
  static descriptor: string;

  constructor(configPath: string = DEFAULT_CONFIG_PATH) {
    this.configPath = configPath;
    this.config = config(configPath);
    this.recordsDb = new RefineryDatabaseWrapper();
  }

  async load(
    entity: any,
    set: string = 'default',
    notebook: string = 'default'
  ): Promise<any> {
    let pr: Promise<string> = new Promise<string>((resolve, reject) => {});
    return pr;
  }

  /**
   * @async @function export exports a serialized set or set fragment
   * @param output output path or location where to store serialized record
   * @param set set name in Refinery Database
   * @param notebook notebook name in Refinery Database
   * @param diffFilter a filter that determines what portion of a set to export
   * @param flipped if true, the dataField2 should be treated as front
   */
  async export(  // TODO: generalize this by accepting a serialization callback
    output: string,
    set: string = 'default',
    notebook: string = 'default',
    diffFilter: number | undefined = undefined,
    flipped: boolean = false
  ): Promise<any> {
    let pr: Promise<string> = new Promise<string>((resolve, reject) => {});
    return pr;
  }

  /**
   * @function _updateExportDiffs updates the `pastExports` on the `IRecord`s
   * @param records array of records that are being exported
   * 
   * This is an identity function that takes an array of records
   * and returns the same array of records, except it inserts a Date
   * object into `pastExports` Array. This is necessary to keep
   * track of export diffs. Imagine you've exported some set
   * to some flashcard application and since then generated a new
   * number of records for the same set in Refinery. If you
   * want to keep your revision deltas in any flashcards app
   * (which is crucial for spaced repetition), you will not want to
   * delete the previous exported set or overwrite it but probably
   * put the new records in a separate batch or figure out a merge.
   * That's why we need to record export events and figure
   * out diffs based on these.
   */
  _updateExportDiffs(records: Array<IRecord>) {
    let out: Array<IRecord> = new Array<IRecord>();
    for (let rec of records) {
      rec.pastExports.push(Date.now());
      out.push(rec);
    }
    return out;
  }

  /**
   * @async @function update performs a bulk update of `IRecord`s
   * @param records array of `IRecord`s
   */
  async update(records: Array<IRecord>) {
    await this.recordsDb.db.bulkDocs<IRecord>(records);
  }

  /**
   * @function find
   * This performs a Mango query against the Db
   * and filters out relevant records.
   * @param set set on the IRecord
   * @param notebook notebook on the IRecord
   */
  async find(
    set: string = 'default',
    notebook: string = 'default',
    diffFilter: number | undefined = undefined,  // TODO: diff filter implementation e.g. diffs database?
  ): Promise<Array<IRecord> | undefined> {
    // const createIdxQuery: PouchDB.Find.CreateIndexOptions = {
    //   index: {
    //     fields: ['flashcard.pastExports']
    //   }
    // }
    // try {
    //   await this.recordsDb.db.createIndex(createIdxQuery);
    // } catch (err) {
    //   logger.log({
    //     level: 'error',
    //     message: `Error creating index ${JSON.stringify(createIdxQuery)}... ${err}`
    //   })
    // }
    const flashcardsQuery: PouchDB.Find.FindRequest<IRecord> = {
      selector: {
        notebook: notebook,
        flashcard: {
          set: set  // TODO: filter out previously exported flashcards on demand
        }
      },
    }
    try {
      let flashcardsResponse = await this.recordsDb.db.find(flashcardsQuery);
      let flashcards: Array<IRecord> | undefined = <Array<IRecord>><unknown>flashcardsResponse.docs;
      if (diffFilter !== undefined) {
        let filteredFlds: Array<any> = flashcards.filter((record)=>{
          record.pastExports[-1] >= diffFilter
        })
      }
      
      
      return flashcards;

    }
    catch (err) {
      logger.log({
        level: 'error',
        message: `Error getting flashcards: ${err}`
      });
    }
    return new Array<IRecord>();
  }
}

export default BaseHandler;
