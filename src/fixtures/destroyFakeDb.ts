import { RefineryDatabaseWrapper } from 'refinery-engines';

const db = new RefineryDatabaseWrapper("admin", "password");

let a = async ()=>{
    await db.db.destroy();
}

a();
