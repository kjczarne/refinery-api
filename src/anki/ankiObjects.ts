import { IModel } from './interfaces';

let questionFormat = '{{Front}}';
let answerFormat = '{{FrontSide}}\n\n<hr id="answer">\n\n{{Back}}';
let css = `.card {\n font-family: arial;
 font-size: 20px;\n
 text-align: center;\n
 color: black;\n
 background-color: white;\n}\n`

const conf = {
    nextPos: 1,
    estTimes: true,
    activeDecks: [1],
    sortType: 'noteFld',
    timeLim: 0,
    sortBackwards: false,
    addToCur: true,
    curDeck: 1,
    newBury: true,
    newSpread: 0,
    dueCounts: true,
    curModel: '1435645724216',
    collapseTime: 1200
};

export const models: IModel = {
    veArs: [],
    name: 'Basic-f15d2',
    tags: ['Tag'],
    did: 1435588830424,
    usn: -1,
    req: [[0, 'all', [0]]],
    flds: [
        {
            name: 'Front',
            media: [],
            sticky: false,
            rtl: false,
            ord: 0,
            font: 'Arial',
            size: 20
        },
        {
            name: 'Back',
            media: [],
            sticky: false,
            rtl: false,
            ord: 1,
            font: 'Arial',
            size: 20
        }
    ],
    sortf: 0,
    latexPre:
        '\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n',
    tmpls: [
        {
            name: 'Card 1',
            qfmt: questionFormat,
            did: null,
            bafmt: '',
            afmt: answerFormat,
            ord: 0,
            bqfmt: ''
        }
    ],
    latexPost: '\\end{document}',
    type: 0,
    id: 1388596687391,
    css,
    mod: 1435645658
};

const decks = {
    1: {
        desc: '',
        name: 'Default',
        extendRev: 50,
        usn: 0,
        collapsed: false,
        newToday: [0, 0],
        timeToday: [0, 0],
        dyn: 0,
        extendNew: 10,
        conf: 1,
        revToday: [0, 0],
        lrnToday: [0, 0],
        id: 1,
        mod: 1435645724
    },
    1435588830424: {
        desc: '',
        name: 'query',
        extendRev: 50,
        usn: -1,
        collapsed: false,
        newToday: [545, 0],
        timeToday: [545, 0],
        dyn: 0,
        extendNew: 10,
        conf: 1,
        revToday: [545, 0],
        lrnToday: [545, 0],
        id: 1435588830424,
        mod: 1435588830
    }
};

const dconf = {
    1: {
        name: 'Default',
        replayq: true,
        lapse: {
        leechFails: 8,
        minInt: 1,
        delays: [10],
        leechAction: 0,
        mult: 0
        },
        rev: {
        perDay: 100,
        fuzz: 0.05,
        ivlFct: 1,
        maxIvl: 36500,
        ease4: 1.3,
        bury: true,
        minSpace: 1
        },
        timer: 0,
        maxTaken: 60,
        usn: 0,
        new: {
        perDay: 20,
        delays: [1, 10],
        separate: true,
        ints: [1, 4, 7],
        initialFactor: 2500,
        bury: true,
        order: 1
        },
        mod: 0,
        id: 1,
        autoplay: true
    }
};