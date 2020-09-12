import { BaseEngine, ExportCallbackType } from './baseEngine';
import { IRecord } from '../interfaces';
import { logger, isUrl } from '../utilities/utils';
import { readFileSync, writeFileSync } from 'fs';
import PouchDb from 'pouchdb';
import PouchdbFind from 'pouchdb-find';
PouchDb.plugin(PouchdbFind);

export class JsonEngine extends BaseEngine {
  
  static descriptor = 'JSON record'

  async load(filePath: string, batch?: string, notebook?: string): Promise<Array<string>> {
    let f: string = readFileSync(filePath, {encoding: 'utf-8'});
    let records: Array<IRecord> = JSON.parse(f);
    return await this.importCallback(records);
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

export default JsonEngine;