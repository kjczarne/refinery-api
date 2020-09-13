/**
 * @interface IPageMap
 * describes the interface for mapping extracted data to original source
 * allowing their back-referencing.
 * 
 * Any module serializing this interface must clearly define the ingress
 * and egress behavior independently.
 */
export interface IPageMap {
  pagemapType?: "epubcfi" | "pdf"  // modifiable, can allow additional types
  pagemapValue?: string
}

export type DataFieldType = [string, string] | [string, string, string] | Array<string>;

/**
 * @interface IRecord
 * describes main piece of data thet is going to be handled by Refinery.
 * 
 * The new interface specifies a `data` field instead of `dataField1`
 * and `dataField2` and the type allows for a flexible definition of
 * stringified data that are being transported.
 */
export interface IRecord {
  [x: string]: any,
  data: DataFieldType,
  source: string,
  _id: string,
  _rev?: string,
  timestampCreated: number,
  timestampModified: number,
  pastExports: Array<number>,    // records batch exports to keep diffing easy
  notebook?: string,
  batch: string,
  // future fields:
  // LATER: handle file attachments
  pageMap?: IPageMap,
  flashcard?: IFlashcard,          // data related to flashcard representation
  linked?: string | Array<string>  // LATER: IDs of related IRecords
}

/**
 * @interface IFlashcard
 * describes flashcard-related metadata of an `IRecord`
 */
export interface IFlashcard {
  scheduler?: ISchedulerProps    // LATER: custom scheduler
}

export interface ISchedulerProps {
  pastRevisions: Array<number>,
  nextRevision: number,
  easinessFactor: number,
}

/**
 * @type displayCallback describes a front-end display callback
 * for a flashcard in `phlower` front end
 */
export type displayCallback = (flashcard: IRecord, selectField: string) => void

/**
 * @interface IConfig defines the master config object
 * It is consistent with the YAML spec and is reused
 * for the React App.
 */
export interface IConfig {
  refinery: {
    database: {
      databaseServer: string,
      databaseName: string,
      user: string,
      password: string
    }
  },
  phlower: {
    notebooks: Array<{
      cfgId: string
    }>,
    decks: Array<{
      cfgId: string,
      algorithm: string
    }>,
    algorithms: Array<{
      cfgId: string,
      new: {
        maxPerDay: number,
        startingDelays: [number, number],
        startingIntervals: [number, number],
        initialFactor: number,
        order: 'random' | 'by-creation-date'
      },
      fail: {
        failsUntilLeech: number,
        minLeechInterval: number,
        delays: Array<number>,
        leechAction: number,
        multiplyInterval: number
      },
      rev: {
        maxPerDay: number
        fuzz: number
        multiplyInterval: number
        maxInterval: number
        initialEaseFactorMultiplier: number
        minSpace: number
      },
      timer: boolean,
      maxTimeSpentOnCard: number,
      autoplayAudio: boolean,
      replayAudioWhenFlipped: boolean
    }>
  }
}