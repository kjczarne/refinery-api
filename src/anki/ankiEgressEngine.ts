// import sha1 from 'sha1';
import * as fs from 'fs';
import * as yaml from 'yaml';
import sha1 = require('sha1');
import JSZip = require('jszip');
import { IMediaObject, IModel, IDeck, IPDeck, IDconf, IPDconf, IPModel, IConf, IYamlConfig } from './interfaces';
import { sqlQueryRun, sqlSchema } from '../engine';
import { IRecord } from '../interfaces';
import { dedent } from 'ts-dedent';
import { conf, models, dconf, decks } from './ankiObjects';
import { logger, mapToJson, queryPrepare, escapeSingleQuotes } from '../utils';

export class AnkiEgressEngine {
    public deckName: string;
    public readonly conf: IYamlConfig

    private _dbPath: string;
    private _deck: IPDeck;
    private _media: Map<number, string> = new Map<number, string>();;
    private _separator: string = '\u001F';
    private _model: IPModel;

    constructor(deckName: string, schema: string, dbPath: string, deckConfigId?: string, modelConfigId?: string) {
        this._dbPath = dbPath;
        this.deckName = deckName;
        this.conf = yaml.parse(fs.readFileSync('./configuration/anki-egress.yaml', 'utf8'));
        sqlSchema(this._dbPath, schema);
        let partialDeckCfgFromId = this.conf.anki.deckConfigs.find((el)=>{el.cfgId === deckConfigId});
        let partialModelCfgFromId = this.conf.anki.algorithmConfigs.find((el)=>{el.cfgId === modelConfigId});
        this._model = models;
        this._deck = decks;
        // use Object.assing(target, source) to transfer properties from YAML config onto template objects:
        Object.assign(this._model, partialModelCfgFromId);
        Object.assign(this._deck, partialDeckCfgFromId);
    }

    /**
     * @function updateCollectionTable updates or creates `col` table in Anki database
     * This function is expected to be called after all cards in the deck have been added.
     */
    updateCollectionTable(){
        // ID in col is always 1, there is only one row in this table at all times
        // the following properties will not be updated in the collection:
        // * crt -> creation date
        // * scm -> schema modification time
        // * ver -> version; superfluous to overwrite each time
        // * dty -> dirty, unused field which is always 0
        // * ls -> last sync time (setting usn should be enough)
        // * conf

        let timestampNow: number = Date.now().valueOf();
        let now: string = timestampNow.toString();
        let nowInSeconds: number = parseInt((timestampNow/1000).toString());

        let decksMap: IDeck = new Map<string, IPDeck>();
        let dconfMap: IDconf = new Map<string, IPDconf>();
        let modelsMap: IModel = new Map<string, IPModel>();
        // if ID found in decksMap or dconfMap update these entries, else append to existing array
        let checkIfExistsQuery: string = `select id from col`
        let query: string;
        
        function idExists(id: string | number, ankiJsonObjMap: IDconf | IDeck | IModel): boolean{
            // TODO: ankiJsonObjMap.forEach??
            for (let k in ankiJsonObjMap){
                let partial: IPDconf | IPDeck | IPModel | undefined = ankiJsonObjMap.get(k);
                if(partial?.id === id){
                    return true;
                } 
            }
            return false;
        }

        function responseToMap(response: any): Map<any, any> {
            let outMap: Map<any, any> = new Map<any, any>();
            let fromJson: any = JSON.parse(response);
            for (let k in fromJson){
                outMap.set(k, fromJson[k]);
            }
            return outMap;
        }

        sqlQueryRun(this._dbPath, checkIfExistsQuery).then((response)=>{
            if (response.length >0){
                logger.log({
                    level: "silly",
                    message: dedent`
                    Found existing col table, where id: ${response}.
                    Response from that query should always be a single number
                    as col table is expected to contain a single row.
                    `
                });
                query = `select models, decks, dconf from col`
                sqlQueryRun(this._dbPath, query).then((response)=>{
                    // preserve existing data from the col table:
                    let existingDecksMap: Map<string, IPDeck> = responseToMap(response[0].decks);
                    let existingDconfMap: Map<string, IPDconf> = responseToMap(response[0].dconf);
                    let existingModelsMap: Map<string, IPModel> = responseToMap(response[0].models);
                    existingDecksMap.forEach((v, k)=>{
                        decksMap.set(k, v);
                    });
                    existingDconfMap.forEach((v, k)=>{
                        dconfMap.set(k, v);
                    });
                    existingModelsMap.forEach((v, k)=>{
                        modelsMap.set(k, v);
                    });
                    if(!idExists(this._model.id, existingModelsMap)){
                        logger.log({
                            level: "silly",
                            message: dedent`
                            Model ID ${this._model.id} doesn't exist in models column, creating...
                            `
                        });
                        modelsMap.set(this._model.id.toString(), this._model);
                    }
                    if(!idExists(this._deck.id, existingDecksMap)){
                        logger.log({
                            level: "silly",
                            message: dedent`
                            Deck ID ${this._deck.id} doesn't exist in decks column, creating...
                            `
                        });
                        decksMap.set(this._deck.id.toString(), this._deck);
                    }
                    if(!idExists(this._model.id, existingDconfMap)){
                        logger.log({
                            level: "silly",
                            message: dedent`
                            Model ID ${this._model.id} doesn't exist in dconf column, creating...
                            `
                        });
                        dconfMap.set(this._model.id.toString(), dconf);
                    }
                    query = dedent`
                        update col set usn=-1,
                        mod=${timestampNow},
                        decks='${mapToJson(decksMap)}',
                        dconf='${mapToJson(dconfMap)}',
                        models='${mapToJson(modelsMap)}'
                    `.replace(/\n/g, "");
                    sqlQueryRun(this._dbPath, query).then(()=>{
                        logger.log({
                            level: "info",
                            message: dedent`
                            Collection updated successfully.
                            `
                        });
                        logger.log({
                            level: "silly",
                            message: dedent`
                            Query used for col table update was: ${query}
                            Decks object: ${mapToJson(decksMap)}
                            Dconf object: ${mapToJson(dconfMap)}
                            Models object: ${mapToJson(modelsMap)}
                            `
                        });
                    }).catch((err)=>{
                        logger.log({
                            level: "error",
                            message: dedent`
                            Error when running col update query: ${err}
                            Query used for col table update was: ${query}
                            `
                        });
                    });
                }).catch((err)=>{
                    logger.log({
                        level: "error",
                        message: dedent`
                        Error when running col update query: ${err}
                        Failed on column selection query: ${query}
                        `
                    });
                });
            }
            else {
                //TODO: handle different type of models and fine-grain customization of the decks through JSON Objects                
                logger.log({
                    level: "silly",
                    message: dedent`
                    No ID found for any existing collection, creating new...
                    `
                });
                dconfMap.set(this._model.id.toString(), dconf);
                modelsMap.set(this._model.id.toString(), this._model);
                decksMap.set(this._deck.id.toString(), decks);
                query = dedent`
                    insert into col values(
                        1,
                        ${nowInSeconds},
                        ${timestampNow},
                        ${timestampNow},
                        14,
                        0,
                        -1,
                        ${timestampNow - 100 /* arbitrary backwards offset */},
                        '${JSON.stringify(conf)}',
                        '${mapToJson(modelsMap)}',
                        '${mapToJson(decksMap)}',
                        '${mapToJson(dconfMap)}',
                        '${JSON.stringify({}) /* not supported yet by us */}'
                    )
                    `.replace(/\n/g, "");
                sqlQueryRun(this._dbPath, query).then(()=>{
                    logger.log({
                        level: "info",
                        message: dedent`
                        Collection table created successfully.
                        `
                    });
                }).catch((err)=>{
                    logger.log({
                        level: "error",
                        message: dedent`
                        Error when running col creation query: ${err}
                        Query used for col table creation was: ${query}
                        `
                    });
                });
            }
        }).catch((err)=>{
            logger.log({
                level: "error",
                message: dedent`
                Error when checking whether col exists: ${err}
                Query used to check whether col exists: ${query}
                `
            });
        })
        
    }
  
    addMedia(data: IMediaObject): void {
        this._media.set(data.index, data.origFilename);
    }
  
    addCard(record: IRecord, swapSides?: boolean, tags?: string | Array<string>): void {
        // handle tags:
        let strTags = '';
        if (typeof tags === 'string') {
            strTags = tags;
        } else if (Array.isArray(tags)) {
            strTags = this._tagsToStr(tags);
        }
        // assign note and highlight to front and back depending on the swapSides flag:
        let front: string = "";
        let back: string = "";
        if (swapSides){
            back = record.dataField2;
            front = record.dataField1;
        }
        else {
            front = record.dataField2;
            back = record.dataField1;
        }
        
        let timestampNow: number = Date.now().valueOf();
        let now: string = timestampNow.toString();
        let nowInSeconds: number = parseInt((timestampNow/1000).toString());
        
        // TODO: the below logic has to be improved to handle updates
        // values in the `cards` table like reps, factor, lapses, etc.
        // need to be left alone and not updated as long as the deck
        // already exists with info that pertains to the repetition that
        // happened up to this point
        // TODO: a direct way of interfacing to the Anki database would be
        // thus more beneficial than just exporting the decks

        let checkIfExistsQuery: string = `select id from cards where nid=${record.timestampCreated}`
        sqlQueryRun(this._dbPath, checkIfExistsQuery)
            .then(
                (response)=>{
                    // the notes table can be safely replaced with new values whether the card already exists or not:
                    let notesTableInsertQuery: string = dedent`insert or replace into notes values(
                            ${record.timestampCreated},
                            '${record._id}',
                            ${this._model.id},
                            ${now},
                            ${-1},
                            '${strTags}',
                            '${escapeSingleQuotes(front + this._separator + back)}',
                            '${escapeSingleQuotes(front)}',
                            ${this._checksum(escapeSingleQuotes(front + this._separator + back))},
                            ${0},
                            '${JSON.stringify(record.pageMap)}');`.replace(/\n/g, "");
                            // data field is unused, can be used to store IRecords and reverse-import Anki Decks
                    sqlQueryRun(this._dbPath, notesTableInsertQuery)
                        .then((responseL2)=>{
                            // but the `cards` table should retain most fields unchanged:
                            let cardsTableQuery: string = "";
                            if (response.length > 0){
                                cardsTableQuery = 
                                    dedent`update cards
                                    set mod=${nowInSeconds},
                                        usn=-1
                                    where nid=${record.timestampCreated};`.replace(/\n/g, "");
                            }
                            else {
                                cardsTableQuery = 
                                    dedent`insert into cards values(
                                        ${record.timestampCreated},
                                        ${record.timestampCreated},
                                        ${this._deck.id},
                                        ${0},
                                        ${nowInSeconds},
                                        ${-1},
                                        ${0},
                                        ${0},
                                        ${record.timestampCreated},
                                        ${0},
                                        ${0},
                                        ${0},
                                        ${0},
                                        ${0},
                                        ${0},
                                        ${0},
                                        ${0},
                                        'empty');`.replace(/\n/g, "");
                            }
                            sqlQueryRun(this._dbPath, cardsTableQuery)
                                .then((responseL3)=>{console.log(`Flashcard ${record.timestampCreated} added`)})
                                .catch((err)=>{console.log(`Error: ${err} while processing flashcard ${record.timestampCreated}`)});
                        }).catch((err)=>{console.log(`Error: ${err} while processing flashcard ${record.timestampCreated}`)})
                }
            ).catch(
                (reason)=>{console.log(`Error: ${reason}, check query: ${checkIfExistsQuery}`);}
            );
    }
    
    /**
     * @function _checksum Generates SHA1 checksum for a particular string
     * @param str string to generate checksum for
     */
    private _checksum(str: string | undefined | null): number | null {
        if (typeof str === 'string'){
            return parseInt(sha1(str).substr(0, 8), 16);
        }
        else return null;
    }

    /**
     * @function _tagsToStr Converts and array of tags to serialized string
     * @param tags Array of tags
     */
    private _tagsToStr(tags: Array<string>): string {
        return ' ' + tags.map(tag => tag.replace(/ /g, '_')).join(' ') + ' ';
    }
}
