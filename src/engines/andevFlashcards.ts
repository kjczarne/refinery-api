import { BaseEngine, ExportCallbackType } from './baseEngine';
import { IRecord } from '../interfaces';
import { logger, isUrl } from '../utils';
import { readFileSync, writeFileSync } from 'fs';
import PouchDb from 'pouchdb';
import PouchdbFind from 'pouchdb-find';
PouchDb.plugin(PouchdbFind);

export class AndevFldsEngine extends BaseEngine {
  
  static descriptor = 'AnDev Flashcards'

  async load(): Promise<string> {  // TODO: AnDev ingress
    let pr: Promise<string> = new Promise<string>((resolve, reject) => {});
    return pr;
  }

  exportCallback(output: string, records: Array<IRecord>, flipped: boolean) {
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

}

export default AndevFldsEngine;