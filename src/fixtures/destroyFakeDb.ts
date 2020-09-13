import { RefineryDatabaseWrapper } from '../databaseWrapper';

const db = new RefineryDatabaseWrapper("admin", "password");

let a = async ()=>{
    await db.db.destroy();
}

a();
