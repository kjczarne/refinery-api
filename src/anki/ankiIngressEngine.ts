import { sqlQueryRun, constructRecords } from '../engine';
import { IPModel, IPDconf, IConf } from './interfaces';
import { logger } from '../utils';
import { IRecord } from '../interfaces';

/**
 * @class AnkiIngressEngine
 * parses Anki database to retrieve IRecord objects
 */
export class AnkiIngressEngine {
    // TODO: below not necessary to load and process here but necessary to compare against the original one
    // model: IPModel;
    // dconf: IPDconf;
    // conf: IConf;


    private _dbPath: string;
    private _separator: string = '\u001F';

    constructor(dbPath: string){
        this._dbPath = dbPath;
    }

    /**
     * @function findDeckId looks up the DID of a deck that goes by a specific name
     * @param deckName name of the deck to be fetched
     * @returns Promise<number> placeholder for DID
     */
    findDeckId(deckName: string): Promise<number>{
        // TODO: constrain promise to IDeck??
        let pr: Promise<number> = new Promise<number>((resolve)=>{
            let query: string = `select decks from col;`
            sqlQueryRun(this._dbPath, query).then((response)=>{
                let deckObj = JSON.parse(response[0]);
                let foundId: number;
                for (let k in deckObj){
                    if (deckObj[k].name === deckName){
                        // find first matching name and grab deck ID
                        foundId = deckObj[k].id;
                        logger.log({
                            level: 'silly',
                            message: `Deck ${deckName} has DID: ${foundId}`
                        });
                        resolve(foundId);
                        break;
                    }
                }
            }).catch((err)=>{
                logger.log({
                    level: 'error',
                    message: `Error looking for Deck Name: ${err}`
                });
                logger.log({
                    level: 'silly',
                    message: `Query when looking for Deck Name: ${query}`
                });
            });
        });
        return pr;
    }

    /**
     * @function loadDeck loads a specifically named deck from Anki database
     * @param deckName deck name to be loaded from the Anki database
     * @returns Promise<Array<IRecord>>, placeholder for an Array of IRecord objects
     */
    loadDeck(deckName: string): Promise<Array<IRecord>>{
        let pr: Promise<Array<IRecord>> = new Promise<Array<IRecord>>((resolve, reject)=>{
            this.findDeckId(deckName).then((response)=>{
                let query: string = `select flds, notes.mod, guid from notes inner join cards where did==${response};`
                sqlQueryRun(this._dbPath, query).then((responseL2)=>{
                    logger.log({
                        level: 'silly',
                        message: `Query: ${query} has successfully returned a response.`
                    });
                    let recordsArray = new Array<IRecord>();
                    for (let flashcardObj of responseL2){
                        recordsArray.push({
                            pageMap: {
                                pagemapValue: '',  // use empty EPUB CFI, for now mapping back to original source isn't supported
                                pagemapType: 'epubcfi'
                            },
                            dataField1: flashcardObj.flds.split(this._separator)[0],
                            dataField2: flashcardObj.flds.split(this._separator)[1],
                            richContent: '',  //TODO: rich content not supported yet
                            _id: flashcardObj.guid,
                            timestampCreated: flashcardObj.mod,  // simplification -> for loaded flashcards mod date will be treated as create date
                            timestampModified: flashcardObj.mod,
                            source: "anki"
                        });
                    }
                    resolve(recordsArray);               
                }).catch((err)=>{
                    logger.log({
                        level: "error",
                        message: `Error loading Anki Deck: ${err}`
                    });
                    logger.log({
                        level: 'silly',
                        message: `Query used to load Anki Deck: ${query}`
                    });
                    reject(`Promise rejected: ${err.message}`);
                });
            })
        });
        return pr;
    }
}