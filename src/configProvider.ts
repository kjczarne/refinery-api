import * as yaml from 'yaml';
import { IConfig } from './interfaces';
import { readFileSync } from 'fs';

/**
 * @function config returns parsed YAML config as JS Object
 * @param config path to the YAML config or YAML-like object
 * 
 * This function behaves like an identity function when
 * an object is provided from the UI (Redux Store), otherwise
 * parses a config from a default YAML file.
 */
export function config(config: string | any = './configuration/.refinery.yaml'){
    // can be modified later to e.g. parse other config files instead
    if (typeof config === 'string'){
        return yaml.parse(readFileSync(config, 'utf8'));
    }
    else {
        return config;
    }
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