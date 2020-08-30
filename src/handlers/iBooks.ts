import { logger } from '../utils';
import { sqlQueryRun } from '../sql';
import { dedent } from 'ts-dedent';
import { DEFAULT_CONFIG_PATH } from '../configProvider';
import { BaseHandler } from './baseHandler';

export class AppleiBooksEngine extends BaseHandler {
  pathToAnnotationDb: string;
  pathToLibraryDb: string;

  static descriptor = 'iBooks'

  private _sqlQuery1: string = dedent`
    SELECT 
    ZASSETID AS assetId,
    ZTITLE AS bookTitle
    FROM ZBKLIBRARYASSET;
    `.replace(/\n/g, ' ');

  // sqlQuery naming columns consistently with IRecord fields:
  private _sqlQuery2: string = dedent`
    SELECT
    ZANNOTATIONNOTE AS dataField2,
    ZANNOTATIONLOCATION AS pagemapValue,
    ZANNOTATIONSELECTEDTEXT AS dataField1,
    ZANNOTATIONASSETID AS assetId
    FROM ZAEANNOTATION;
    `.replace(/\n/g, ' ');
  
  constructor(configPath: string = DEFAULT_CONFIG_PATH) {
    super(configPath);
    this.pathToAnnotationDb = this.config.ibooks.annotationsDb;
    this.pathToLibraryDb = this.config.ibooks.libraryDb;
  }

  async load(bookName: string, batch: string = bookName, notebook: string = 'default'): Promise<Array<string>> {
    let pr: Promise<Array<string>> = new Promise<Array<string>>((resolve, reject) => {
      sqlQueryRun(this.pathToLibraryDb, this._sqlQuery1).then((response1) => {
        sqlQueryRun(this.pathToAnnotationDb, this._sqlQuery2).then((response2) => {
          // filter out annotations that match the title in the function signature:
          var filteredResponse1 = response1.filter((v) => { return v.bookTitle === bookName });
          let filteredResponse2 = response2.filter((v) => { return filteredResponse1.filter((v2) => { v2.assetId === v.assetId }) });
          // add ebook type info to the response object:
          filteredResponse2.forEach((v) => {
            v['pageMap'] = { pagemapType: 'epubcfi', pagemapValue: v.pagemapValue };
            v['richContent'] = '';
            v['source'] = bookName;
            v['configPath'] = this.configPath;
            v['batch'] = batch;
            v['notebook'] = notebook

          });
          // construct records:
          this.importCallback(filteredResponse2).then((res: Array<string>)=>{
            resolve(res);
          }).catch((err)=>{
            logger.log({
              level: 'error',
              message: `importCallback threw an error: ${err}`
            })
          });
        });
      });
    })
    return pr;
  }
}

