import { BaseEngine } from './baseEngine';
import { IRecord } from '../interfaces';
import { logger, isUrl } from '../utilities/utils';
import { readFileSync, writeFileSync } from 'fs';
import { convert, constructRecord } from '../engine';
import { MdConvSpec } from '../conversionSpecs';
import PouchDb from 'pouchdb';
import PouchdbFind from 'pouchdb-find';
PouchDb.plugin(PouchdbFind);

export class MdEngine extends BaseEngine {

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
                  MdConvSpec.WRAP_DF2(),
                  "",
                  MdConvSpec.WRAP_FOOTER());
  }

  convertFromMarkdown(
    serializedFile: string,
    notebook: string = 'default',
    batch?: string
    ): Array<IRecord> {
    let outputArray: Array<IRecord> = new Array<IRecord>();
    let [preBlock, block, ...postBlock] = serializedFile.split(MdConvSpec.MAGIC_MARKER());
    let titlePrep = preBlock.split(MdConvSpec.WRAP_TITLE()[0]);
    let batchMd = titlePrep[titlePrep.length - 1];
    // if called with batch, use that, else, use the MD document title
    if (batch === undefined) {
      var batchUsed = batchMd.trim();  // clean off whitespace
    } else {
      var batchUsed = batch;
    }
    // strip all the newlines
    let strippedBlock = block.trim();
    // split the block on dash or asterisk list
    let splitBlock = strippedBlock.split(MdConvSpec.WRAP_DF1()[0]);
    for (let i = 0; i < splitBlock.length; i++) {
      let [df1, df2] = splitBlock[i].split(MdConvSpec.WRAP_DF1()[1]+MdConvSpec.WRAP_DF2()[0]);
      if (df1 !== undefined || df2 !== undefined) {
        if (df1.length < MdConvSpec.MINIMUM_CHARACTERS || 
            df2.length < MdConvSpec.MINIMUM_CHARACTERS) {
          continue;
        }
      }
      let record = constructRecord(
        df1.trim(), 
        df2.trim(), 
        'Md', 
        batchUsed, 
        notebook
      );
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