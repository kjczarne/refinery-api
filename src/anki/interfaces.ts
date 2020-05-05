export interface IConf {
    nextPos: number,
    estTimes: boolean,
    activeDecks: Array<number>,
    sortType: string,
    timeLim: 0,
    sortBackwards: boolean,
    addToCur: boolean,
    curDeck: number,
    newBury: boolean,
    newSpread: number,
    dueCounts: boolean,
    curModel: string,
    collapseTime: number,
};

export interface IModel {
    veArs: Array<any>,
    name: string,
    tags: Array<string>,
    did: number,  // deck ID
    usn: number,
    req: Array<[number, string, Array<number>]>,
    flds: [
        {
            name: 'Front',
            media: Array<string>,
            sticky: boolean,
            rtl: boolean,
            ord: number,
            font: string,
            size: number
        },
        {
            name: 'Back',
            media: Array<string>,
            sticky: boolean,
            rtl: boolean,
            ord: number,
            font: string,
            size: number
        }
    ],
    sortf: number,
    latexPre: string,
    tmpls: [
        {
            name: string,
            qfmt: string,   // question format (front)
            did: number | null,      // deck ID (is a timestamp integer and can be converted to Date object)
            bafmt: string,
            afmt: string,   // answer format (back)
            ord: number,
            bqfmt: string
        }
    ],
    latexPost: string,
    type: number,
    id: number,             // model ID, also a key in orginal object
    css: string,
    mod: number
};

export interface IDeck {
    desc: string,
    name: string,
    extendRev: number,
    usn: number,
    collapsed: boolean,
    newToday: [number, number],
    timeToday: [number, number],
    dyn: number,
    extendNew: number,
    conf: number,  // maps to DConf key
    revToday: [number, number],
    lrnToday: [number, number],
    id: number,  // deck ID
    mod: number
};
/**
 * @interface IDconf
 * Interface describing the expected structure of the
 * spaced repetition algorithm config. Placed in the
 * `dconf` table in the `sqlite` database.
 */
export interface IDconf{
    name: string,
    replayq: true,
    lapse: {
        leechFails: number,
        minInt: number,
        delays: Array<number>,
        leechAction: number,
        mult: number
    },
    rev: {
        perDay: number,
        fuzz: number,
        ivlFct: number,
        maxIvl: number,
        ease4: number,
        bury: boolean,
        minSpace: number
    },
    timer: number,
    maxTaken: number,
    usn: number,
    new: {
        perDay: number,
        delays: [number, number],
        separate: boolean,
        ints: [number, number, number],
        initialFactor: number,
        bury: boolean,
        order: number
    },
    mod: number,
    id: number,
    autoplay: boolean
};

/**
 * @interface IMediaObject
 * Defines the map between media files and their filenames
 * with respective format extensions. This will be later
 * serialized to a JSON that has a {"number": "original_filename"}
 * mapping.
 */
export interface IMediaObject {
    index: number,
    origFilename: string
}