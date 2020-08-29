import { BaseHandler } from './baseHandler';
import { IRecord } from '../interfaces';
import { logger, isUrl } from '../utils';
import { readFile, writeFileSync } from 'fs';
import { convert } from '../engine';
import { MdConvSpec } from '../conversionSpecs';
import PouchDb from 'pouchdb';
import PouchdbFind from 'pouchdb-find';
PouchDb.plugin(PouchdbFind);

export class MdEngine extends BaseHandler {

  static descriptor = 'Plain Markdown'

    /**
   * @function convertToMarkdown Converts IRecords to a Markdown
   * serialized string.
   * @param record IRecord or an Array of IRecord Objects
   * @param title Desired title of the Markdown document
   * @returns string
   */
  convertToMarkdown(
    record: IRecord | Array<IRecord>,
    title: string
  ): string{
    return convert(record, 
                  title,
                  MdConvSpec.WRAP_TITLE(),
                  MdConvSpec.WRAP_DF1(),
                  MdConvSpec.WRAP_DF2());
  }

  convertFromMarkdown(){} // TODO: MD inverse conversion MD -> Refinery

  async load(filePath: string, set: string, notebook: string) {
    // this.importCallback();
  }

  exportCallback(output: string, records: Array<IRecord>, flipped: boolean) {
    let ids: Array<string> = Array<string>();
    let serialized: string = ''
    
    for (let rec of records) {
      ids.push(rec._id);
      serialized += this.convertToMarkdown(rec, rec.set)
    }

    writeFileSync(output, serialized, { encoding: 'utf-8' });

    return ids;
  }
    
}

export default MdEngine;