#!/usr/bin/env node
// use process.parameters here, first two args are the node command elements (node, script path)
import relayEgress from '../relays/egressRelay';
import relayIngress from '../relays/ingressRelay';
import { BaseEngine } from 'refinery-core';
import { ExpectedParametersEgress, ExpectedParametersIngress } from './interfaces';
import { BaseController } from './baseController';

export class ApiController extends BaseController {

  private _username: string | undefined;
  private _password: string | undefined;

  constructor(username?: string, password?: string) {
    super();
    this._username = username;
    this._password = password;
  }

  // config assumed to be specified on deployment of the server
  // or default used; no reconfiguration possibility from
  // client's level

  relayClosureEgress(
    engine: BaseEngine,
    parameters: Exclude<ExpectedParametersEgress, { config: string }>
  ) {
    return relayEgress(
      engine,
      parameters.path,
      parameters.batch,
      parameters.notebook,
      parameters.diff,
      parameters.flipped
    );
  }

  relayClosureIngress(
    engine: BaseEngine,
    parameters: Exclude<ExpectedParametersIngress, { config: string }> 
      & Required<Pick<ExpectedParametersIngress, "resource">>
  ) {
    return relayIngress(
      engine,
      parameters.resource,
      parameters.batch,
      parameters.notebook
    );
  }

  refineIn(parameters: Exclude<ExpectedParametersIngress, { config: string }> 
    & Required<Pick<ExpectedParametersIngress, "resource">>) {
      let idx = this.allEngineNames.findIndex((val)=>{return val === <string>parameters.what});
      this.relayClosureIngress(
        new this.allEngines[idx](this._username, this._password, this.config),
        parameters
      );
    }
  
  refineOut(parameters: Exclude<ExpectedParametersEgress, { config: string }>) {
    let idx = this.allEngineNames.findIndex((val)=>{return val === <string>parameters.what});
    this.relayClosureEgress(
      new this.allEngines[idx](this._username, this._password, this.config),
      parameters
    );
  }
}

export default ApiController;

