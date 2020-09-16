import { RefineryDatabaseWrapper } from 'refinery-core';
import { Record } from 'refinery-core';
import { IRecord } from 'refinery-core';
import { logger } from 'refinery-core';

const db = new RefineryDatabaseWrapper("admin", "password");

let minimalRecordDoc: IRecord = {
    data: ["lorem ipsum", "dolor set amet"],
    _id: 'lorem',
    timestampCreated: Date.now(),
    timestampModified: Date.now(),
    source: 'source',
    notebook: 'default',
    batch: 'default',
    pastExports: new Array<number>(),
}

let minimalRecord: Record = new Record(
    minimalRecordDoc.data,
    minimalRecordDoc.source,
    minimalRecordDoc.batch,
    minimalRecordDoc.notebook
);
minimalRecord._id = minimalRecordDoc._id;  // override to simple ID
console.log(minimalRecord)
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