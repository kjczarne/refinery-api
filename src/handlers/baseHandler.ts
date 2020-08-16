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
        deck: string, 
        notebook: string='default'
    ): Promise<any> {
        let pr: Promise<any> = new Promise<any>((resolve, reject)=>{
            resolve({
                entity: entity,
                deck: deck,
                notebook: notebook
            })
        })
        return pr;
    }
}

export default BaseHandler;
