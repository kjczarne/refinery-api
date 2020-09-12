import * as yaml from 'yaml';
import { readFileSync } from 'fs';

export const DEFAULT_CONFIG_PATH = './configuration/.refinery.yaml'

/**
 * @function config returns parsed YAML config as JS Object
 * @param config path to the YAML config or YAML-like object
 * 
 * This function behaves like an identity function when
 * an object is provided from the UI (Redux Store), otherwise
 * parses a config from a default YAML file.
 */
export function config(config: string | any = DEFAULT_CONFIG_PATH){
    // can be modified later to e.g. parse other config files instead
    if (typeof config === 'string'){
        return yaml.parse(readFileSync(config, 'utf8'));
    }
    else {
        return config;
    }
}

export default config;