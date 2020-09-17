import { string } from "yargs";
import { BaseEngine } from 'refinery-engines';
import { AndevFldsEngine } from 'refinery-engines';
import { AppleiBooksEngine } from 'refinery-engines';
import { JsonEngine } from 'refinery-engines';
import { MdEngine } from 'refinery-engines';
import { config } from 'refinery-core';
import { YourEngines } from '../yourEngines';
import yargs from 'yargs';
import _ from 'lodash';
import path from 'path';

export class BaseController {
  config = config();

  /**
   * defines options common to both the Egress and Ingress controllers
   */
  commonOptions: Record<any, yargs.Options> =
    {
      batch: {
        type: 'string',
        demandOption: true
      },
      notebook: {
        type: 'string',
        demandOption: true
      },
      config: {
        type: 'string',
        demandOption: false
      },
      user: {
        type: 'string',
        demandOption: false
      },
      password: {
        type: 'string',
        demandOption: false
      }
    };

  private _egressChoicesDefault: any;
  private _ingressChoicesDefault: any;
  private _extraEgress: any;
  private _extraIngress: any;
  egressChoices: Array<string>;
  ingressChoices: Array<string>;
  whatEgress: yargs.Options
  whatIngress: yargs.Options
  allEngines: Array<typeof BaseEngine>;
  allEngineNames: Array<string>;

  /**
   * Loads user-defined Engines and dynamically
   * adds them to the available CLI args or API parameters.
   */
  constructor() {
    this._loadExtraEngines();
    this._egressChoicesDefault = this.egressChoicesFunc(this._defaultWhatKeys, this._defaultWhatValues);
    this._ingressChoicesDefault = this.ingressChoicesFunc(this._defaultWhatKeys, this._defaultWhatValues);
    this._extraEgress = this.egressChoicesFunc(this._whatKeysExtra(), this.extraEngines);
    this._extraIngress = this.ingressChoicesFunc(this._whatKeysExtra(), this.extraEngines);

    this.egressChoices = this._egressChoicesDefault.concat(this._extraEgress);
    this.ingressChoices = this._ingressChoicesDefault.concat(this._extraIngress);
    
    this.whatEgress = {
      type: 'string',
      demandOption: true,
      choices: this.egressChoices
    }

    this.whatIngress = {
      type: 'string',
      demandOption: true,
      choices: this.ingressChoices
    }

    this.allEngineNames = this._defaultWhatKeys.concat(this._whatKeysExtra());
    this.allEngines = this._defaultWhatValues.concat(this.extraEngines);
  }
  
  /**
   * here, built-in Engine arg names are specified
   */
  private _defaultWhatKeys: Array<string> = new Array<string>(
    MdEngine.arg, JsonEngine.arg, AndevFldsEngine.arg, AppleiBooksEngine.arg
  )

  /**
   * here, built-in Engine types are specified
   */
  private _defaultWhatValues: Array<typeof BaseEngine> = new Array<typeof BaseEngine>(
    MdEngine, JsonEngine, AndevFldsEngine, AppleiBooksEngine
  )

  /**
   * this maps the arg keys to respective types (built-ins)
   */
  defaultWhatMap = _.zip(this._defaultWhatKeys, this._defaultWhatValues)

  uniq = (value: any, index: number, self: Array<any>) => { 
    return self.indexOf(value) === index;
  }

  /**
   * contains user-defined Engines
   */
  extraEngines = new Array<typeof BaseEngine>();

  /**
   * @function _loadExtraEngines loads user-defined Engines using
   * paths to scripts specified in the yourEngines.ts
   */
  private _loadExtraEngines() {
    if (YourEngines.length > 0) {
      try {
        for (let p of YourEngines) {
          this.extraEngines.push(p);
        }
      } catch (err) {
        for (let p of YourEngines) {
          this.extraEngines.push(p);
        }
      }
    }
  }

  /**
   * @function _whatKeysExtra returns arg keys of user-defined Engines
   */
  private _whatKeysExtra = () => {
    let keys: Array<string> = new Array<string>();
    for (let e of this.extraEngines) {
      keys.push(e.arg);
    }
    return keys;
  }
  
  /**
   * @function ingressChoicesFunc returns a list of keys
   * filtered out of a list of Engines that support ingress
   * @param whatKeys array of keys (cli args or API params)
   * @param whatValues array of BaseEngine children
   */
  ingressChoicesFunc = (
    whatKeys: Array<string>,
    whatValues: Array<typeof BaseEngine>
  ) => _.filter<Array<string | undefined>>(_.map(whatValues, (val, idx, self)=>{
    let ret = val.hasIngress ? whatKeys[idx] : undefined;
    return ret;
  }), (val)=>{val !== undefined});
  
  /**
   * @function egressChoicesFunc returns a list of keys
   * filtered out of a list of Engines that support egress
   * @param whatKeys array of keys (cli args or API params)
   * @param whatValues array of BaseEngine children
   */
  egressChoicesFunc = (
    whatKeys: Array<string>,
    whatValues: Array<typeof BaseEngine>
  ) => _.filter<Array<string | undefined>>(_.map(whatValues, (val, idx, self)=>{
    let ret = val.hasEgress ? whatKeys[idx] : undefined;
    return ret;
  }), (val)=>{val !== undefined});
}