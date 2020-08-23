import { BaseHandler } from './baseHandler';
import { IRecord } from '../interfaces';
import { logger, isUrl } from '../utils';
import { readFileSync, writeFileSync } from 'fs';
import { convertToMarkdown } from '../engine';
import PouchDb from 'pouchdb';
import PouchdbFind from 'pouchdb-find';
PouchDb.plugin(PouchdbFind);

export class MdEngine extends BaseHandler {

  static descriptor = 'Plain Markdown'

  exportCallback(output: string, records: Array<IRecord>, flipped: boolean) {
    let ids: Array<string> = Array<string>();
    let serialized: string = ''
    
    for (let rec of records) {
      serialized += convertToMarkdown(rec, rec.set)
    }

    writeFileSync(output, serialized, { encoding: 'utf-8' });

    return ids;
  }
    
}

export default MdEngine;