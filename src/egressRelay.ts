import { logger } from './utils';
import { BaseHandler } from './handlers/baseHandler';

let f = (
    engine: BaseHandler,
    output: string,
    batch: string = 'default',
    notebook: string = 'default',
    diffFilter: number | undefined = undefined,
    flipped: boolean = false
)=>{
    engine.export(
        output,
        batch,
        notebook,
        diffFilter,
        flipped
    ).then((response)=>{
        logger.log({
            level: 'info',
            message: `Batch ${batch} exported to ${BaseHandler.descriptor}`
        });
        if (response !== undefined){
            for (let i of response){
                logger.log({
                    level: 'silly',
                    message: `Batch: ${batch}, ID: ${i}`
                });
            }
        }
    }).catch((err)=>{
        logger.log({
            level: 'error',
            message: `Error exporting the batch to ${BaseHandler.descriptor}: ${err}`
        })
    });
}

export default f;