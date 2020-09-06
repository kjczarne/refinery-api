import { RefineryDatabaseWrapper } from '../engine';

const db = new RefineryDatabaseWrapper("admin", "password");

let a = async ()=>{
    await db.db.destroy();
}

a();
