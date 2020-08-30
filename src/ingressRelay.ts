import { logger } from './utils';
import BaseHandler from './handlers/baseHandler';

let f = (
    engine: BaseHandler,
    resource: string,
    batch?: string,
    notebook?: string
)=>{
    engine.load(resource, batch, notebook).then(()=>{
        logger.log({
            level: 'info',
            message: `${resource} loaded from ${BaseHandler.descriptor} to Refinery Database.`
        });
    }).catch((err)=>{
        logger.log({
            level: 'error',
            message: `${resource} load failed from ${BaseHandler.descriptor}: ${err}`
        })
    });
}

export default f;