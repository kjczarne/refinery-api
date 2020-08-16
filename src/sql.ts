import * as sqlite from 'better-sqlite3';
import { logger } from './utils';
import { dedent } from 'ts-dedent';

/**
 * @function _queryPrepare initially cleans up query string
 * @param query Valid SQL query.
 */
export function queryPrepare(query: string): string{
    let cleanQuery: string = query.replace(/--.*/g, "")   // remove comments
                                  .replace(/  +/g, "")    // mush into single line
                                  .replace(/\n/g, " ")    // mush into single line
    return cleanQuery;
}

/**
 * @function sqlQuery
 * Queries a `sqlite` database and closes connection
 * afterwards. Multiple apps make liberal use of `sqlite`
 * databases, iBooks and Anki for example, thus it makes
 * sense to encapsulate the steps required for querying
 * those databases in a function that can be reused
 * across the whole platform.
 * @param db sqlite3.Database
 * @param sqlQuery Valid SQL query
 * @returns Promise<Array<any>>
 */
export function sqlQueryHelper(
    db: sqlite.Database,
    sqlQuery: string,
    mode: 'get' | 'run' = 'get'
): Promise<Array<any>>{
    let rows: Array<any> = new Array<any>();
    // create Promise as a placeholder for `rows`:
    let pr: Promise<Array<any>>;
    pr = new Promise<Array<any>>((resolve, reject)=>{
        try {
            if (mode == 'get'){
                let responseRows = db.prepare(sqlQuery).all()
                for (let row of responseRows){
                    rows.push(row);
                }
            }
            else if (mode == 'run'){
                db.prepare(sqlQuery).run()
            }
            
            resolve(rows);
        }
        catch(err){
            // use logger, SQL problems are hard to debug:
            logger.log({
                level: 'error', 
                message: `Error at sqlQueryHelper (pre-response): ${err.message}`
            });
            logger.log({
                level: 'silly',
                message: `Query with which sqlQueryHelper was called is: ${sqlQuery}`
            });
            reject(err.message);
        }
    });
    return pr;
}

/**
 * @function sqlQueryRun 
 * encapsulates sending a query to a sqlite3 database,
 * always closes connection afterwards (maximum cleanup)
 * @param dbPath path to the sqlite3 database
 * @param sqlQuery valid SQL query
 */
export function sqlQueryRun(
    dbPath: string,
    sqlQuery: string,
    mode: 'get' | 'run' = 'get'
): Promise<Array<any>> {
    function closeDb(db: sqlite.Database){
        try {
            db.close();
            logger.log({level: 'silly', message: 'Connection closed successfully.'});
        }
        catch(err){
            logger.log({
                level: 'error', 
                message: `Error at sqlQueryRun when closing database ${dbPath}: ${err.message}`
            });
        }
    }
    let pr: Promise<Array<any>> = new Promise((resolve, reject)=>{
        let returnVal: Array<any> = new Array<any>();
        let db: sqlite.Database = new sqlite.default(dbPath);
        sqlQueryHelper(db, sqlQuery, mode).then(
            (response)=>{
                closeDb(db);
                logger.log({
                    level: 'silly', 
                    message: `Query: ${sqlQuery} has succesfully returned a response.`
                });
                resolve(response);
            }
        ).catch(
            (err)=>{
                closeDb(db);
                logger.log({
                    level: 'error', 
                    message: dedent`
                    Error at sqlQueryRun when calling helper: ${err.message}
                    The query provided was: ${sqlQuery}`
                });
                reject(err.message);
        });
    })
    return pr;
}

export function sqlSchema(dbPath: string, schema: string){
    let cleanSchema: string = queryPrepare(schema)
    let splitSchema: Array<string> = cleanSchema.split(';');
    // pop last, because we don't expect any valid query after the last `;` char:
    splitSchema.pop();
    let promiseChain: Array<Promise<any>> = new Array<Promise<any>>();
    let pr: Promise<void> = new Promise<void>(async (resolve, reject)=>{
        // put back `;` onto each element of the array with a trailing space for safety
        for (let i = 0; i<splitSchema.length; i++){
            if (splitSchema[i].length > 1){
                splitSchema[i] += '; '
                promiseChain.push(sqlQueryRun(dbPath, splitSchema[i], 'run'));
            }
        }
        async function awaitSequence(
            arrayOfPromises: Array<Promise<any>>,
        ){
            let responses = Array<any>();
            for (let i =0; i<arrayOfPromises.length; i++) {
                try {
                    responses.push(await arrayOfPromises[i]);
                    logger.log({
                        level: 'silly',
                        message: `Successful schema query: ${splitSchema[i]}`
                    });
                }
                catch(err){
                    logger.log({
                        level: 'error',
                        message: `Error ${err} while processing schema creation query: ${splitSchema[i]}`
                    });
                    reject();
                }
            }
            resolve();
            return responses;
        }
        awaitSequence(promiseChain);
    });
    return pr;
}