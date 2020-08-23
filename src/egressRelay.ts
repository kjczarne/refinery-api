import { logger } from './utils';
import { BaseHandler } from './handlers/baseHandler';

let f = (
    engine: BaseHandler,
    output: string,
    set: string = 'default',
    notebook: string = 'default',
    diffFilter: number | undefined = undefined,
    flipped: boolean = false
)=>{
    engine.export(
        output,
        set,
        notebook,
        diffFilter,
        flipped
    ).then((response)=>{
        logger.log({
            level: 'info',
            message: `Set ${set} exported to ${BaseHandler.descriptor}`
        });
        if (response !== undefined){
            for (let i of response){
                logger.log({
                    level: 'silly',
                    message: `Set: ${set}, ID: ${i}`
                });
            }
        }
    }).catch((err)=>{
        logger.log({
            level: 'error',
            message: `Error exporting the set to ${BaseHandler.descriptor}: ${err}`
        })
    });
}

export default f;