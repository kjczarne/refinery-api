import { RefineryDatabaseWrapper } from '../engine';
import { IRecord } from '../interfaces';

const db = new RefineryDatabaseWrapper();

let minimalRecord: IRecord = {
    dataField1: "lorem ipsum",
    dataField2: "dolor set amet",
    _id: 'lorem',
    timestampCreated: Date.now(),
    timestampModified: Date.now(),
    source: 'source',
    flashcard: {
        easinessFactor: 2.5,
        deck: 'default',
        scheduler: {
            pastRevisions: new Array<number>(),
            nextRevision: Date.now()
        }
    }
}

let a = async ()=>{
    await db.db.put(minimalRecord);
}

a();