import { logger } from '../utils';
import { AppleiBooksEngine } from '../handlers/iBooks';

let f = (
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