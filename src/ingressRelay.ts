import { logger } from './utils';
import BaseHandler from './handlers/baseHandler';

let f = (
    engine: BaseHandler,
    resource: string
)=>{
    engine.load(resource).then(()=>{
        logger.log({
            level: 'info',
            message: `${resource} loaded from ${BaseHandler.descriptor} to Refinery Database.`
        });
    });
}

export default f;