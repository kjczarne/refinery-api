import { BaseEngine, ExportCallbackType } from './baseEngine';
import { Record } from '../record';
import { logger, isUrl } from '../utilities/utils';
import { readFileSync, writeFileSync } from 'fs';
import PouchDb from 'pouchdb';
import PouchdbFind from 'pouchdb-find';
PouchDb.plugin(PouchdbFind);

export class AndevFldsEngine extends BaseEngine {
  
  static descriptor = 'AnDev Flashcards'

  static arg = 'andev';

  static hasIngress = false;
  static hasEgress = true;

  async load(): Promise<string> {  // TODO: AnDev ingress
    let pr: Promise<string> = new Promise<string>((resolve, reject) => {});
    return pr;
  }

  exportCallback(output: string, records: Array<Record>, flipped: boolean) {
    let ids: Array<string> = new Array<string>();
    let serialized: string = '';

    if (records !== undefined) {
      for (let fld of records){
        ids.push(fld._id);
        let row: string = ''
        let url: string = ''
        let examples: string = ''
        if (isUrl(fld.source)){
          url = ',' + fld.source
        }
        if (fld.data[2] !== undefined) {
          examples = ',' + fld.data[2];
        }
        let optionalFields: string = examples + url
        if (flipped) {
          row += fld.data[1] + ',' + fld.data[0] + optionalFields + '\n'
        } else {
          row += fld.data[0] + ',' + fld.data[1] + optionalFields + '\n'
        }
        serialized += row;
      }

      writeFileSync(output, serialized, {encoding: 'utf-8'});
    }

    return ids;
  }

}

export default AndevFldsEngine;