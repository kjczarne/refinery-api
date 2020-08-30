import { RefineryDatabaseWrapper, constructRecords } from '../engine';
import { config, DEFAULT_CONFIG_PATH } from '../configProvider';
import { IRecord } from '../interfaces';
import { logger } from '../utils';
import { create, map } from 'lodash';
import dedent from 'ts-dedent';

export type ExportCallbackType = (output: string, recs: Array<IRecord>, flipped: boolean)=>Array<string>;

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

  async load(  //TODO: transfer to interface
    entity: any,
    batch: string = 'default',
    notebook: string = 'default'
  ): Promise<any> {
    let pr: Promise<string> = new Promise<string>((resolve, reject) => { });
    return pr;
  }

  /**
   * @async @function `importCallback` facilitates bulk doc write
   * @param arrayOfRecords Array of `IRecord` objects to write to Db
   * @returns Promise<Array<string>> Array of IDs of docs written to the Db
   */
  async importCallback(arrayOfRecords: Array<IRecord>){
    let pr: Promise<Array<string>> = new Promise<Array<string>>((resolve, reject) => {
      constructRecords(arrayOfRecords).then((response) => {
          response.forEach((v) => { return JSON.stringify(v) });
          this.recordsDb.db.bulkDocs(response).then((res) => {
            logger.log({
              level: 'silly',
              message:
                dedent`Added ${JSON.stringify(response)} to RefineryDb.
                              Response: ${res}`
            })
          }).catch((err) => {
            logger.log({
              level: 'error',
              message:
                `Error PUTting docs into the RefineryDb: ${err}`
            });
          });
          resolve(response.map((value: IRecord) => value._id));
        });
      });
    return pr;
  }

  exportCallback(output: string, records: Array<IRecord>, flipped: boolean) {
    return new Array<string>();
  }  // TODO: transfer to an interface

  /**
   * @async @function export exports a serialized batch or batch fragment
   * @param output output path or location where to store serialized record
   * @param callback serializes the received IRecords to a file/buffer
   * @param batch batch name in Refinery Database
   * @param notebook notebook name in Refinery Database
   * @param diffFilter a filter that determines what portion of a batch to export
   * @param flipped if true, the dataField2 should be treated as front
   * @returns Array<string>, array of doc IDs that got extracted
   */
  async export(
    output: string,
    batch: string = 'default',
    notebook: string = 'default',
    diffFilter: number | undefined = undefined,
    flipped: boolean = false
  ): Promise<Array<string> | undefined> {
    let ids: Array<string> = Array<string>();
    try {
      let records: Array<IRecord> | undefined = await this.find(batch, notebook, diffFilter)

      if (records !== undefined) {
        ids = this.exportCallback(output, records, flipped);  // serialization to a file happens here
        let updated = this._updateExportDiffs(records);
        await this.update(updated);
      }

      return ids;

    }
    catch (err) {
      logger.log({
        level: 'error',
        message: `Error getting flashcards: ${err}`
      });
    }
    return ids;
  }

  /**
   * @function _updateExportDiffs updates the `pastExports` on the `IRecord`s
   * @param records array of records that are being exported
   * 
   * This is an identity function that takes an array of records
   * and returns the same array of records, except it inserts a Date
   * object into `pastExports` Array. This is necessary to keep
   * track of export diffs. Imagine you've exported some batch
   * to some flashcard application and since then generated a new
   * number of records for the same batch in Refinery. If you
   * want to keep your revision deltas in any flashcards app
   * (which is crucial for spaced repetition), you will not want to
   * delete the previous exported batch or overwrite it but probably
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
   * @param batch batch on the IRecord
   * @param notebook notebook on the IRecord
   */
  async find(
    batch: string = 'default',
    notebook: string = 'default',
    diffFilter: number | undefined = undefined,
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
        batch: batch
      },
    }
    try {
      let flashcardsResponse = await this.recordsDb.db.find(flashcardsQuery);
      let flashcards: Array<IRecord> | undefined = <Array<IRecord>><unknown>flashcardsResponse.docs;
      if (diffFilter !== undefined) {
        var filteredFlds: Array<IRecord> = flashcards.filter((record)=>{
          record.pastExports[-1] >= diffFilter
        })
      } else {
        var filteredFlds: Array<IRecord> = flashcards;
      }

      return filteredFlds;

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
