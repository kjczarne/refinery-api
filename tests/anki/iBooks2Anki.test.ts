import assert from 'assert';
import { AnkiEgressEngine } from '../../src/anki/ankiEgressEngine';
import { AnkiIngressEngine } from '../../src/anki/ankiIngressEngine';
import { IRecord } from '../../src/interfaces';
import { sqlSchema, sqlQueryRun } from '../../src/engine';
import { queryPrepare, logger, delay} from '../../src/utils';
import { dedent } from 'ts-dedent';
import { AppleiBooksEngine } from '../../src/ibooks/iBooksEngine';
import { promises as fs, readFileSync } from 'fs';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

// var ankiIngress: AnkiIngressEngine = undefined;
// var ankiEgress: AnkiEgressEngine = undefined;

let iBooksDbPath: string = './tests/res/ibooks/ibooks_db_mock.sqlite';
let iBooksSchemaPath: string = './tests/res/ibooks/ibooks_db_mock_schema.sql';
let iBooksLibraryDbPath: string = './tests/res/ibooks/ibooks_library_mock.sqlite';
let iBooksLibrarySchemaPath: string = './tests/res/ibooks/ibooks_library_mock_schema.sql';

let iBooksEngine = new AppleiBooksEngine();

describe("Testing iBooks -> Anki", function(){
    describe("Testing iBooks -> RefineryDB", function(){
        before(async function(){
            // create fake iBooks dbs:
            let steps: Array<Promise<any>> = [
                // create database files so connection can be established:
                fs.writeFile(iBooksDbPath, ''),
                fs.writeFile(iBooksLibraryDbPath, ''),
                sqlSchema(iBooksDbPath, 
                    readFileSync(iBooksSchemaPath).toString()),
                sqlQueryRun(iBooksDbPath, 
                    queryPrepare(dedent`insert into ZAEANNOTATION values(
                        1,1,1,0,1,3,3,0,1,1,607716201.000000,607716201.000000,
                        'blah-blah','blah-blah','some-cfi','lorem ipsum','',
                        'dolor set amet','some-uuid', ${"\' \',".repeat(13)} ' '
                    );`), 'run'),
                sqlSchema(iBooksLibraryDbPath, 
                    readFileSync(iBooksLibrarySchemaPath).toString()),
                sqlQueryRun(iBooksLibraryDbPath,
                    queryPrepare(dedent`insert into ZBKLIBRARYASSET values(
                        ${"1,".repeat(37)}
                        607716201.000000,
                        0.0,
                        ${'607716201.000000,'.repeat(3)}
                        0.0,
                        ${'607716201.000000,'.repeat(7)}
                        0.0,
                        ${'607716201.000000,'.repeat(2)}
                        0.0,
                        ' ',
                        'blah-blah',
                        ${"\' \',".repeat(25)}
                        'lorem ipsum book title',
                        ' ', ' '
                    );`), 'run')
            ]
            let x = await steps.reduce(async (prev, next)=>{
                try {
                    let p = await prev;
                    logger.log({
                        level: 'silly',
                        message: `"Before" query response: ${p}`
                    });
                    return next;
                    
                }
                catch(err){
                    logger.log({
                        level: "error",
                        message: `Test error, promise rejected, reason: ${err}`
                    });
                }
            }, Promise.resolve([]));
            return x;
        });
        it(`Should pass if a book is inserted into RefineryDb
            and corresponding ID can be found.`, async function(){
            // load event is supposed to load book by title into RefineryDB:
            let docId = await iBooksEngine.load('lorem ipsum book title');
            var response = undefined
            iBooksEngine.recordsDb.auth.then(async ()=>{
                response = await iBooksEngine.recordsDb.db.get(docId);
                assert.notEqual(response, undefined);
            }).catch((err)=>{
                logger.log({
                    level: 'error',
                    message: `Test error: ${err}`
                })
            });
        });
        after(async function(){
            await fs.unlink(iBooksDbPath);
            await fs.unlink(iBooksLibraryDbPath);
            iBooksEngine.recordsDb.auth.then(async ()=>{
                await iBooksEngine.recordsDb.server.destroy(
                    iBooksEngine.config.refinery.database.databaseName
                )
            }).catch((err)=>{
                logger.log({
                    level: 'error',
                    message: `Error destroying RefineryDb: ${err}`
                })
            })
        });
    });
});
