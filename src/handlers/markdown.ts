import { BaseHandler } from './baseHandler';
import { IRecord } from '../interfaces';
import { logger, isUrl } from '../utils';
import { readFileSync, writeFileSync } from 'fs';
import { convertToMarkdown } from '../engine';
import PouchDb from 'pouchdb';
import PouchdbFind from 'pouchdb-find';
PouchDb.plugin(PouchdbFind);

export class MdEngine extends BaseHandler {

  static descriptor = 'Plain Markdown'

  /**
   * @function export
   * Exports queried flashcards to a Markdown summary.
   */
  async export(
    output: string,
    deck: string = 'default',
    notebook: string = 'default',
    diffFilter: string = '',  // TODO: diff filter implementation e.g. diffs database?
    flipped: boolean = false
  ): Promise<Array<string> | undefined> {
    const flashcardsQuery: PouchDB.Find.FindRequest<IRecord> = {
      selector: {
        notebook: notebook,
        flashcard: {
          deck: deck
        }
      },
    }
    let ids: Array<string> = Array<string>();
    let serialized: string = ''
    try {
      let flashcards: Array<IRecord> | undefined = await this.find(deck, notebook, diffFilter)

      if (flashcards !== undefined) {
        for (let fld of flashcards) {
          serialized += convertToMarkdown(fld, deck)
        }
        writeFileSync(output, serialized, { encoding: 'utf-8' });
      }
      
      return ids;

    }
    catch (err) {
      logger.log({
        level: 'error',
        message: `Error getting flashcards: ${err}`
      });
    }
    return ids;
  }
}

export default MdEngine;