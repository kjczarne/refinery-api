/*
Conventions used: I*   -> denotes that the Object is an Interface
                  IP*  -> denotes a "partial" interface (one that needs to be packed in a
                          corresponding data structure, whose interface is placed directly below)
                  IPP* -> denotes a partial of a partial interface, will sometimes be needed
                          to allow object construction to be handled in a simpler way
*/

export interface IYamlConfig {
    anki: {
        deckConfigs: Array<Pick<
            IPDeck,
                "cfgId" |
                "extendRev" |
                "extendNew" |
                "dyn" |
                "conf"
        >>,
        algorithmConfigs: Array<Pick<
            IPDconf,
                "cfgId" |
                "lapse" |
                "rev" |
                "timer" |
                "maxTaken" |
                "new" |
                "autoplay" |
                "replayq"
        >>
    }
}

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

export interface IPModel {
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
            bafmt: string,  // browser answer format (back)
            afmt: string,   // answer format (back)
            ord: number,
            bqfmt: string   // browser question format (back)
        }
    ],
    latexPost: string,
    type: number,
    id: number,             // model ID, also a key in orginal object
    css: string,
    mod: number
};

/**
 * @type IModel defines a map: modelId (id on IPModel) -> IPModel
 */
export type IModel = Map<string, IPModel>

/**
 * @interface IDeck describes a deck object
 */
export interface IPDeck {
    cfgId?: string,
    desc: string,
    name: string,
    extendRev?: number,
    usn: number,
    collapsed: boolean,
    newToday: [number, number],
    timeToday: [number, number],
    dyn?: number,   // dynamic deck if set to 1
    extendNew?: number,
    conf?: number,  // maps to DConf key, not present if `dyn` is set to 1
    revToday: [number, number],
    lrnToday: [number, number],
    id: number,  // deck ID
    mod: number
};

/**
 * @type IPDeck 
 * is a partial interface defining bare minimum to create and update a deck
 */
export type IPPDeck = Pick<IPDeck, 'desc' | 'name' | 'mod' | 'id'>

/**
 * @type IDeck defines a map: modelId -> IPDeck
 */
export type IDeck = Map<string, IPDeck>

/**
 * @interface IPDconf
 * Interface describing the expected structure of the
 * spaced repetition algorithm config per deck. Placed in the
 * `dconf` table in the `sqlite` database packed into a map,
 * as represented by @type IDconf
 */
export interface IPDconf{
    cfgId?: string,
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
 * @type IDConf defines a map: modelId -> IPDconf
 */
export type IDconf = Map<string, IPDconf>;

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