import { BaseHandler } from './baseHandler';
import { IRecord } from '../interfaces';
import { logger, isUrl } from '../utils';
import { readFileSync, writeFileSync } from 'fs';
import { convert, constructRecord } from '../engine';
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
  ): string {
    return convert(record, 
                  title,
                  MdConvSpec.WRAP_TITLE(),
                  MdConvSpec.WRAP_DF1(),
                  MdConvSpec.WRAP_DF2());
  }

  convertFromMarkdown(
    serializedFile: string,
    notebook: string = 'default',
    batch?: string
    ): Array<IRecord> {
    let outputArray: Array<IRecord> = new Array<IRecord>();
    // peel off the title
    let [batchMd, ...rest] = serializedFile.split(MdConvSpec.WRAP_TITLE()[1]);
    // if called with batch, use that, else, use the MD document title
    if (batch === undefined) {
      var batchUsed = batchMd.replace(/# ?/, '');
    } else {
      var batchUsed = batch;
    }
    let joinBack = rest.join(MdConvSpec.WRAP_TITLE()[1]);
    let splitRecords = joinBack.split(MdConvSpec.WRAP_DF2()[1]);
    for (let i = 0; i < splitRecords.length; i++) {
      let [df1, df2] = splitRecords[i].split(MdConvSpec.WRAP_DF1()[1]);
      let record = constructRecord(df1, df2, 'Md', undefined, undefined, batchUsed, notebook);
      outputArray.push(record);
    }
    return outputArray;
  }

  async load(filePath: string, batch?: string, notebook?: string): Promise<Array<string>> {
    let f: string = readFileSync(filePath, {encoding: 'utf-8'});
    let records: Array<IRecord> = this.convertFromMarkdown(f, notebook, batch);
    return await this.importCallback(records);
  }

  exportCallback(output: string, records: Array<IRecord>, flipped: boolean) {
    let ids: Array<string> = Array<string>();
    let serialized: string = ''
    
    for (let rec of records) {
      ids.push(rec._id);
      serialized += this.convertToMarkdown(rec, rec.batch)
    }

    writeFileSync(output, serialized, { encoding: 'utf-8' });

    return ids;
  }
    
}

export default MdEngine;