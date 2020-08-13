import { RefineryDatabaseWrapper } from '../engine';

const db = new RefineryDatabaseWrapper();

let a = async ()=>{
    await db.db.destroy();
}

a();
