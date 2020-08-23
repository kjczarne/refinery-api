import { BaseHandler, ExportCallbackType } from './baseHandler';
import { IRecord } from '../interfaces';
import { logger, isUrl } from '../utils';
import { readFileSync, writeFileSync } from 'fs';
import PouchDb from 'pouchdb';
import PouchdbFind from 'pouchdb-find';
PouchDb.plugin(PouchdbFind);

export class JsonEngine extends BaseHandler {
  
  static descriptor = 'JSON record'

  async load(): Promise<string> {  // TODO: JSON ingress
    let pr: Promise<string> = new Promise<string>((resolve, reject) => {});
    return pr;
  }

  exportCallback(output: string, records: Array<IRecord>, flipped: boolean) {
    let ids: Array<string> = new Array<string>();
    let serialized: string = '';

    if (records !== undefined) {
      for (let fld of records){
        ids.push(fld._id);
        serialized += JSON.stringify(fld);
      }

      writeFileSync(output, serialized, {encoding: 'utf-8'});
    }

    return ids;
  }

}

export default AndevFldsEngine;