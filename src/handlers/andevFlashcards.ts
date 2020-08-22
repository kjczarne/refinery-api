import { BaseHandler } from './baseHandler';
import { IRecord } from '../interfaces';
import { logger, isUrl } from '../utils';
import { readFileSync, writeFileSync } from 'fs';
import PouchDb from 'pouchdb';
import PouchdbFind from 'pouchdb-find';
PouchDb.plugin(PouchdbFind);

export class AndevFldsEngine extends BaseHandler {
  
  static descriptor = 'AnDev Flashcards'

  constructor(configPath: string = './configuration/.refinery.yaml') {
    super(configPath);

  }

  async load(): Promise<string> {  // TODO: AnDev ingress
    let pr: Promise<string> = new Promise<string>((resolve, reject) => {});
    return pr;
  }

  /**
   * @function export
   * This creates an AnDev Flashcards CSV file that can be loaded into the Android app.
   * AnDev's app uses the following formatting:
   * Term1,Definition1
   * Term2,Definition2,examples(optional),url(optional)
   * Term3,Definition3
   */
  async export(
    output: string,
    deck: string = 'default',
    notebook: string = 'default',
    diffFilter: string = '',  // TODO: diff filter implementation e.g. diffs database?
    flipped: boolean = false
  ): Promise<Array<string> | undefined> {
    let ids: Array<string> = Array<string>();
    let serialized: string = ''
    try {
      let flashcards: Array<IRecord> | undefined = await this.find(deck, notebook, diffFilter)
      
      if (flashcards !== undefined) {
        for (let fld of flashcards){
          ids.push(fld._id);
          let row: string = ''
          let url: string = ''
          let examples: string = ''
          if (isUrl(fld.source)){
            url = ',' + fld.source
          }
          if (fld.note !== undefined) {
            examples = ',' + fld.note;
          }
          let optionalFields: string = examples + url
          if (flipped) {
            row += fld.dataField2 + ',' + fld.dataField1 + optionalFields + '\n'
          } else {
            row += fld.dataField1 + ',' + fld.dataField2 + optionalFields + '\n'
          }
          serialized += row;
        }
        writeFileSync(output, serialized, {encoding: 'utf-8'});
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
}

export default AndevFldsEngine;