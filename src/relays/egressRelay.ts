import { logger } from '../utils';
import { BaseEngine } from '../engines/baseEngine';

let f = (
    engine: BaseEngine,
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
            message: `Batch ${batch} exported to ${BaseEngine.descriptor}`
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
            message: `Error exporting the batch to ${BaseEngine.descriptor}: ${err}`
        })
    });
}

export default f;