import { RefineryDatabaseWrapper } from '../engine';
import { config } from '../configProvider';

/**
 * @class BaseHandler base class for the handler classes
 */
export class BaseHandler {
  configPath: string;
  config: any;
  recordsDb: RefineryDatabaseWrapper;

  constructor(configPath: string = './configuration/.refinery.yaml') {
    this.configPath = configPath;
    this.config = config(configPath);
    this.recordsDb = new RefineryDatabaseWrapper();
  }

  async load(
    entity: any,
    deck: string = 'default',
    notebook: string = 'default'
  ): Promise<any> {
    let pr: Promise<string> = new Promise<string>((resolve, reject) => {});
    return pr;
  }

  /**
   * @async @function export exports a serialized Deck or Deck fragment
   * @param output output path or location where to store serialized record
   * @param deck deck name in Refinery Database
   * @param notebook notebook name in Refinery Database
   * @param diffFilter a filter that determines what portion of a deck to export
   * @param flipped if true, the dataField2 should be treated as front
   */
  async export(
    output: string,
    deck: string = 'default',
    notebook: string = 'default',
    diffFilter: string = '',
    flipped: boolean = false
  ): Promise<any> {
    let pr: Promise<string> = new Promise<string>((resolve, reject) => {});
    return pr;
  }
}

export default BaseHandler;
