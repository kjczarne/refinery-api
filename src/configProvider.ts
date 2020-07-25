import * as yaml from 'yaml';
import { IConfig } from './interfaces';

/**
 * @function config returns parsed YAML config as JS Object
 * @param config YAML config as string or YAML-like object, or undefined
 * 
 * This function behaves like an identity function when
 * an object is provided from the UI (Redux Store), otherwise
 * can parse a YAML serialized string or provide default config.
 */
export function config(config: IConfig | string | undefined = undefined){
    const defaultConfig: IConfig = {
        refinery: {
            database: {
                databaseServer: 'http://localhost:5984/',
                databaseName: 'refinerydb',
                user: 'admin',
                password: 'password'
            }
        },
        phlower: {
            notebooks: [{cfgId: 'default'}],
            decks: [{cfgId: 'default', algorithm: 'default'}],
            algorithms: [{
                cfgId: 'default',
                new: {
                    maxPerDay: 20,
                    startingDelays: [1, 10],
                    startingIntervals: [1, 4],
                    initialFactor: 2.5,
                    order: 'random'
                },
                fail: {
                    failsUntilLeech: 8,
                    minLeechInterval: 1,
                    delays: [10],
                    leechAction: 0,
                    multiplyInterval: 0,
                },
                rev: {
                    maxPerDay: 100,
                    fuzz: 0.05,
                    multiplyInterval: 1,
                    maxInterval: 365,
                    initialEaseFactorMultiplier: 1.3,
                    minSpace: 1,
                },
                timer: true,
                maxTimeSpentOnCard: 60,
                autoplayAudio: true,
                replayAudioWhenFlipped: true,
            }]
        }
    }
    if (typeof config === 'undefined'){
        return defaultConfig;
    }
    else if (typeof config === 'string'){
        return yaml.parse(config);
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