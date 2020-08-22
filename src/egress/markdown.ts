/* 
This creates a Markdown summary of a deck.
*/
import { logger } from '../utils';
import { MdEngine } from '../handlers/markdown';

let f = (
    output: string,
    deck: string = 'default',
    notebook: string = 'default',
    diffFilter: string = '',  // TODO: diff filter implementation e.g. diffs database?
    flipped: boolean = false
)=>{
    let mdEngine: MdEngine = new MdEngine();

    mdEngine.export(
        output,
        deck,
        notebook,
        diffFilter,
        flipped
    ).then((response)=>{
        logger.log({
            level: 'info',
            message: `Deck ${deck} exported to a Markdown file at ${output}.`
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
            message: `Error exporting the deck to Markdown: ${err}`
        })
    });
}

export default f;