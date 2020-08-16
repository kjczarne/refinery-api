import { logger } from '../utils';
import { AppleiBooksEngine } from '../handlers/iBooks';
import { iBooks2RefineryFunction } from './interfaces';

let f: iBooks2RefineryFunction = (
    bookName: string
)=>{
    let iBooksEngine: AppleiBooksEngine = new AppleiBooksEngine();

    iBooksEngine.load(bookName).then(()=>{
        logger.log({
            level: 'info',
            message: `Book ${bookName} loaded from iBooks to Refinery Database.`
        });
    });
}

export default f;