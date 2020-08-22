import { logger } from './utils';
import { BaseHandler } from './handlers/baseHandler';

let f = (
    engine: BaseHandler,
    output: string,
    deck: string = 'default',
    notebook: string = 'default',
    diffFilter: string = '',  // TODO: diff filter implementation e.g. diffs database?
    flipped: boolean = false
)=>{
    engine.export(
        output,
        deck,
        notebook,
        diffFilter,
        flipped
    ).then((response)=>{
        logger.log({
            level: 'info',
            message: `Deck ${deck} exported to ${BaseHandler.descriptor}`
        });
        if (response !== undefined){
            for (let i of response){
                logger.log({
                    level: 'silly',
                    message: `Deck: ${deck}, ID: ${i}`
                });
            }
        }
    }).catch((err)=>{
        logger.log({
            level: 'error',
            message: `Error exporting the deck to ${BaseHandler.descriptor}: ${err}`
        })
    });
}

export default f;