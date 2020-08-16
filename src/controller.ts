import { IRecord, displayCallback } from "./interfaces";
import { RefineryDatabaseWrapper } from "./engine";
import { config } from './configProvider';
import { Scheduler } from './scheduler';
import { logger } from "./utils";
import PouchDb from 'pouchdb';
import PouchdbFind from 'pouchdb-find';
PouchDb.plugin(PouchdbFind);

export class FlashcardRevisionController {

  // toAskQueue: Array<IRecord>;
  answeredStack: Array<IRecord> = new Array<IRecord>();
  recordsDb: RefineryDatabaseWrapper;
  config: any;
  sessionOn: boolean = false;
  sessionStart?: Date;
  sessionEnd?: Date;

  constructor() {
    this.config = config();
    this.recordsDb = new RefineryDatabaseWrapper();
  }

  // For convenience steps that the controller should follow
  // are placed in sequential order

  startSession() {
    this.sessionOn = true;
    this.sessionStart = new Date(Date.now());
  }

  /**
   * @function getScheduledFlaschcards fetches flashcards that are scheduled for revision
   * from records database
   */
  async getScheduledFlaschcards(){
    const flashcardsQuery: PouchDB.Find.FindRequest<IRecord> = {
      selector: {
        flashcard: {
          scheduler: {
            nextRevision: { '$lte': this.sessionStart }
          }  // get all that have a scheduled revision before the beginning of the session
        }
      },
    }
    try {
      let flashcardsResponse = await this.recordsDb.db.find(flashcardsQuery);
      let flashcards: Array<any> | undefined = flashcardsResponse.docs
      // for (let flashcard of flashcards){
      //     // DB returns date string not Date object, thus a parse needs to happen
      //     flashcard.flashcard.scheduler.nextRevision = Date.parse(flashcard.flashcard.scheduler.nextRevision);
      // }
      return <Array<IRecord>><unknown>flashcards;
    }
    catch (err) {
      logger.log({
        level: 'error',
        message: `Error getting scheduled flashcards: ${err}`
      });
    }
  }

  /**
   * @function askFlashcard facilitates querying the user during revision
   * @param flashcard IRecord under revision
   * @param fieldToAsk which field of the IRecord should be the question
   * @param displayCallback hook to display this in front-end
   */
  askFlashcard(
    flashcard: IRecord,
    fieldToAsk: string,
    displayCallback: displayCallback
  ) {
    displayCallback(flashcard, fieldToAsk);
    return Date.now();
  }

  /**
   * @function showAnswer relays answer to the user for assessment
   * @param flashcard IRecord under revision
   * @param answerField which field of the IRecord to display as answer
   * @param displayCallback hook to display in front-end
   */
  showAnswer(
    flashcard: IRecord,
    answerField: string,
    displayCallback: displayCallback
  ) {
    displayCallback(flashcard, answerField);
    return Date.now();
  }

  /**
   * @function answerToFlashcard facilitates answering to a query
   * @param flashcard IRecord under revision
   * @param responseQuality quality of user's answer (self-assessed)
   */
  answerToFlashcard(
    flashcard: IRecord,
    responseQuality: number,
  ) {
    // TODO: when called the scheduler should take the response, compute new EF and set next interval
    // move to `answeredStack` for database write at the end of the session
    if (flashcard.flashcard !== undefined){
      new Scheduler(flashcard.flashcard.deck).setNextRevision(flashcard, responseQuality);
      this.answeredStack.push(flashcard);
    }
  }

  /**
   * @function postUpdatedFlashcards sends updated flashcards to the records database.
   */
  async postUpdatedFlashcards() {
    try {
      // await this.recordsDb.auth;  //TODO: check if the connection stays open
      await this.recordsDb.db.bulkDocs(this.answeredStack);
    }
    catch (err) {
      logger.log({
        level: 'error',
        message: `Error updating docs after ended flashcard session: ${err}`
      })
    }
  }

  endSession() {
    this.sessionOn = false;
    this.sessionEnd = new Date(Date.now());
    // write updated data to the database:
  }

}