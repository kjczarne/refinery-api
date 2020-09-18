import { RefineryDatabaseWrapper } from 'refinery-core';

const db = new RefineryDatabaseWrapper("admin", "password");

let a = async ()=>{
    await db.db.destroy();
}

a();
