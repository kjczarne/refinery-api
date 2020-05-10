// import sha1 from 'sha1';
import * as sqlite from 'sqlite3';
import * as fs from 'fs';
import sha1 = require('sha1');
import JSZip = require('jszip');
import { IMediaObject, IModel } from './interfaces';
import { sqlQueryRun } from '../engine';
import { IRecord } from '../interfaces';
import { dedent } from 'ts-dedent';

/**
 * @function escapeSingleQuotes escapes single quotes in a SQL query
 * @param str SQL query that can possibly contain unescaped single quotes
 */
function escapeSingleQuotes(str: string | undefined | null){
    if (typeof str === 'string'){
        return str.replace(/'/g, `''`)
    }
    else return null;
}

export class AnkiEngine {
    public deckName: string;

    private _dbPath: string;
    private _deckId: number;
    private _zip: JSZip = new JSZip();
    private _media: Map<number, string> = new Map<number, string>();;
    private _separator: string = '\u001F';
    private _model: IModel;

    constructor(deckName: string, deckId: number, schema: string, dbPath: string, model: IModel) {
        this._dbPath = dbPath;
        this.deckName = deckName;
        this._model = model;
        this._deckId = deckId;
        let splitSchema: Array<string> = schema.split(';\n');
        
        for (let i = 0; i<splitSchema.length; i++){
            splitSchema[i] += ';'
        }
        for (let el of splitSchema){
            let cleanQuery: string = this._queryPrepare(el);
            if (cleanQuery.length > 0){
                sqlQueryRun(this._dbPath, cleanQuery)
                .then((response)=>{})
                .catch((err)=>{console.log(`Error ${err} while processing schema creation query: ${el}`)});
            }
        }
    }

    /**
     * @function _queryPrepare initially cleans up query string
     * @param query Valid SQL query.
     */
    private _queryPrepare(query: string): string{
        // let ret: any;
        let cleanQuery: string = query.replace(/--.*/g, "")   // remove comments
                                      .replace(/\n\s+/g, "")   // mush into single line
                                      .replace(/\n/g, "")      // mush into single line
        return cleanQuery;
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
            back = record.note;
            front = record.origText;
        }
        else {
            front = record.note;
            back = record.origText;
        }
        
        let timestampNow: number = Date.now().valueOf();
        let now: string = timestampNow.toString();
        let nowInSeconds: string = parseInt((timestampNow/1000).toString()).toString();
        
        // TODO: the below logic has to be improved to handle updates
        // values in the `cards` table like reps, factor, lapses, etc.
        // need to be left alone and not updated as long as the deck
        // already exists with info that pertains to the repetition that
        // happened up to this point
        // TODO: a direct way of interfacing to the Anki database would be
        // thus more beneficial than just exporting the decks

        // FIXME: seems to run async and yield very different results across runs
        let checkIfExistsQuery: string = `select id from cards where nid=${record.timestampCreated}`
        sqlQueryRun(this._dbPath, checkIfExistsQuery)
            .then(
                (response)=>{
                    // the notes table can be safely replaced with new values whether the card already exists or not:
                    let notesTableInsertQuery: string = this._queryPrepare(
                        dedent`insert or replace into notes values(
                            ${record.timestampCreated},
                            '${record.guid}',
                            ${this._model.id},
                            ${now},
                            ${-1},
                            '${strTags}',
                            '${escapeSingleQuotes(front + this._separator + back)}',
                            '${escapeSingleQuotes(front)}',
                            ${this._checksum(escapeSingleQuotes(front + this._separator + back))},
                            ${0},
                            'empty');`.replace(/\n/g, "")
                            // TODO: data field is unused, can be used to store IRecords and reverse-import Anki Decks
                    );
                    sqlQueryRun(this._dbPath, notesTableInsertQuery)
                        .then((responseL2)=>{
                            // but the `cards` table should retain most fields unchanged:
                            let cardsTableQuery: string = "";
                            if (response.length > 0){
                                // console.log("bishhh dat's tru!")
                                cardsTableQuery = this._queryPrepare(
                                    dedent`update cards
                                    set mod=${nowInSeconds},
                                        usn=-1
                                    where nid=${record.timestampCreated};`.replace(/\n/g, "")
                                );
                            }
                            else {
                                cardsTableQuery = this._queryPrepare(
                                    //FIXME: `replace` liable cards seem to still get through here, ID not unique enough???
                                    dedent`insert into cards values(
                                        ${record.timestampCreated},
                                        ${record.timestampCreated},
                                        ${this._deckId},
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
                                        'empty');`.replace(/\n/g, "")
                                );
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
