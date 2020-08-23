import { RefineryDatabaseWrapper } from '../engine';
import { IRecord } from '../interfaces';
import { logger } from '../utils';

const db = new RefineryDatabaseWrapper();

let minimalRecord: IRecord = {
    dataField1: "lorem ipsum",
    dataField2: "dolor set amet",
    _id: 'lorem',
    timestampCreated: Date.now(),
    timestampModified: Date.now(),
    source: 'source',
    notebook: 'default',
    set: 'default',
    pastExports: new Array<number>(),
    flashcard: {
        scheduler: {
            easinessFactor: 2.5,
            pastRevisions: new Array<number>(),
            nextRevision: Date.now()
        }
    }
}

let a = async ()=>{
    try {
        await db.db.put(minimalRecord);
    } catch(err) {
        logger.log({
            level: 'error',
            message: `Put rejected: ${err}`
        });
        console.log(err);
    }
}

a();