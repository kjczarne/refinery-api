import * as yaml from 'yaml';
import { readFileSync } from 'fs';

/**
 * @function config returns parsed YAML config as JS Object
 * @param configPath path to the YAML config
 */
export function config(configPath: string = './configuration/.refinery.yaml'){
    // can be modified later to e.g. parse other config files instead
    return yaml.parse(readFileSync(configPath, 'utf8'));
}

/**
 * @function deckConfig filters out the deck configuration section
 * @param deck deck name in the config file
 * @param configObj configuration Object as returned by `config` function
 */
export function deckConfig(deck: string, configObj: any){
    return configObj.phlower.decks.filter((el: any)=>{return el.cfgId == deck});
}

/**
 * @function algorithmConfig filters out the algorithm configuration section
 * @param deck deck name in the config file
 * @param configObj configuration Object as returned by `config` function
 */
export function algorithmConfig(deck: string, configObj: any){
    return configObj.phlower.algorithms.filter(
        (el: any)=>{
            // filter out algorithms named in the deckConfig...
            return deckConfig(deck, configObj).filter(
                (el2: any)=>{
                    return el == el2.algorithm
                }
            )
        })[0];  // ...and use the first matching algorithm
}