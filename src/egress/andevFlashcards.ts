/* 
This creates an AnDev Flashcards CSV file that can be loaded into the Android app.
AnDev's app uses the following formatting:

Term1,Definition1
Term2,Definition2,examples(optional),url(optional)
Term3,Definition3
*/
import { logger } from '../utils';
import { AndevFldsEngine } from '../handlers/andevFlashcards';

let f = (
    output: string,
    deck: string = 'default',
    notebook: string = 'default',
    diffFilter: string = '',  // TODO: diff filter implementation e.g. diffs database?
    flipped: boolean = false
)=>{
    let andevEngine: AndevFldsEngine = new AndevFldsEngine();

    andevEngine.export(
        output,
        deck,
        notebook,
        diffFilter,
        flipped
    ).then((response)=>{
        logger.log({
            level: 'info',
            message: `Deck ${deck} exported to AnDev Flashcards.`
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
            message: `Error exporting the deck to AnDev Flashcards: ${err}`
        })
    });
}

export default f;