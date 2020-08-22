import { RefineryDatabaseWrapper } from '../engine';
import { config, DEFAULT_CONFIG_PATH } from '../configProvider';
import { IRecord } from '../interfaces';
import { logger } from '../utils';

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
    deck: string = 'default',
    notebook: string = 'default'
  ): Promise<any> {
    let pr: Promise<string> = new Promise<string>((resolve, reject) => {});
    return pr;
  }

  /**
   * @async @function export exports a serialized Deck or Deck fragment
   * @param output output path or location where to store serialized record
   * @param deck deck name in Refinery Database
   * @param notebook notebook name in Refinery Database
   * @param diffFilter a filter that determines what portion of a deck to export
   * @param flipped if true, the dataField2 should be treated as front
   */
  async export(
    output: string,
    deck: string = 'default',
    notebook: string = 'default',
    diffFilter: string = '',
    flipped: boolean = false
  ): Promise<any> {
    let pr: Promise<string> = new Promise<string>((resolve, reject) => {});
    return pr;
  }


  /**
   * @function find
   * This performs a Mango query against the Db
   * and filters out relevant records.
   * @param deck deck on the IRecord
   * @param notebook notebook on the IRecord
   */
  async find(
    deck: string = 'default',
    notebook: string = 'default',
    diffFilter: string = '',  // TODO: diff filter implementation e.g. diffs database?
  ): Promise<Array<IRecord> | undefined> {
    const flashcardsQuery: PouchDB.Find.FindRequest<IRecord> = {
      selector: {
        notebook: notebook,
        flashcard: {
          deck: deck
        }
      },
    }
    try {
      let flashcardsResponse = await this.recordsDb.db.find(flashcardsQuery);
      let flashcards: Array<any> | undefined = flashcardsResponse.docs
      
      return <Array<IRecord>><unknown>flashcards;

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
