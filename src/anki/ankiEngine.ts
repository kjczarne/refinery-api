// import sha1 from 'sha1';
import * as sqlite from 'sqlite3';
import * as fs from 'fs';
import sha1 = require('sha1');
import JSZip = require('jszip');
import { IMediaObject, IModel } from './interfaces';
import { sqlQueryRun } from '../engine';
import { IRecord } from '../interfaces';
import { dedent } from 'ts-dedent';
  
export class AnkiEngine {
    private _dbPath: string;
    private _deckName: string;
    private _deckId: number;
    private _zip: JSZip = new JSZip();
    private _media: Map<number, string> = new Map<number, string>();;
    private _separator: string = '\u001F';
    private _model: IModel;

    constructor(deckName: string, deckId: number, schema: string, dbPath: string, model: IModel) {
        this._dbPath = dbPath;
        this._deckName = deckName;
        this._model = model;
        this._deckId = deckId;
        let splitSchema: Array<string> = schema.split(';\n');
        for (let i = 0; i<schema.length; i++){
            splitSchema[i] += ';'
        }
        for (let el of splitSchema){
            this._baseQueryHandler(el);
        }
    }

    /**
     * @function _baseQueryHandler uses `sqlQueryRun` to get simple
     * responses from the database.
     * @param query Valid SQL query.
     */
    private _baseQueryHandler(query: string){
        let ret: any;
        sqlQueryRun(this._dbPath, dedent(query).replace(/\n\s+/g, "").replace(/\n/g, "")).then(
            (response)=>{ret = response;}
        ).catch(
            (reason)=>{console.log(reason);}
        );
        return ret;
    }
  
    addMedia(data: IMediaObject): void {
        this._media.set(data.index, data.origFilename);
    }
  
    addCard(record: IRecord, swapSides?: boolean, tags?: string | Array<string>) {
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
        
        // TODO: first query against the GUID of a flashcard and check if it exists
        // modify the logic for existing ones

        // check whether given GUID already exists (if so we need to update instead of inserting):
        let suchIdExists: boolean = (
            this._baseQueryHandler(`select id from cards where nid="${record.timestampCreated}"`) != undefined
        );
        // the notes table can be safely replaced with new values whether the card already exists or not:
        this._baseQueryHandler(
            `insert or replace into notes values(
                ${record.timestampCreated},
                '${record.guid}',
                ${this._model.id},
                ${now},
                ${-1},
                '${strTags}',
                '${front + this._separator + back}',
                '${front}',
                ${this._checksum(front + this._separator + back)},
                ${0},
                '${' empty '}')`  // TODO: data field is unused, can be used to store IRecords and reverse-import Anki Decks
        );
        // but the `cards` table should retain most fields unchanged:
        if (suchIdExists){
            this._baseQueryHandler(
                `update cards
                set mod=${nowInSeconds},
                    usn=-1
                where nid=${record.timestampCreated};`
            );
        }
        else {
            this._baseQueryHandler(
                `insert into cards values(
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
                    '${' empty '}')`
            );
        }
    }
    
    /**
     * @function _checksum Generates SHA1 checksum for a particular string
     * @param str string to generate checksum for
     */
    private _checksum(str: string) {
        return parseInt(sha1(str).substr(0, 8), 16);
    }

    /**
     * @function _tagsToStr Converts and array of tags to serialized string
     * @param tags Array of tags
     */
    private _tagsToStr(tags: Array<string>) {
        return ' ' + tags.map(tag => tag.replace(/ /g, '_')).join(' ') + ' ';
    }
}
