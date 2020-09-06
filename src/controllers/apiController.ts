#!/usr/bin/env node
// use process.parameters here, first two args are the node command elements (node, script path)
import relayEgress from '../relays/egressRelay';
import relayIngress from '../relays/ingressRelay';
import AndevEngine from '../engines/andevFlashcards';
import MdEngine from '../engines/markdown';
import JsonEngine from '../engines/json';
import BaseEngine from '../engines/baseEngine';
import { ExpectedParametersEgress, ExpectedParametersIngress } from './interfaces';
import { AppleiBooksEngine } from '../engines/iBooks';

export class ApiController {

  private _username: string | undefined;
  private _password: string | undefined;

  constructor(username?: string, password?: string) {
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
      switch (parameters.what) {
        case 'ibooks': {
          this.relayClosureIngress(
            new AppleiBooksEngine(
              this._username,  // TODO: reduce code duplication here
              this._password
            ),
            parameters
          )
        }
        case 'md': {
          this.relayClosureIngress(
            new MdEngine(
              this._username,
              this._password
            ),
            parameters
          )
        }
      }
    }
  
  refineOut(parameters: Exclude<ExpectedParametersEgress, { config: string }>) {
    switch (parameters.what) {
      case 'andev':
        return this.relayClosureEgress(
          new AndevEngine(
            this._username,
            this._password
          ),
          parameters
        );
      case 'md': {
        return this.relayClosureEgress(
          new MdEngine(
            this._username,
            this._password
          ),
          parameters
        )
      }
      case 'json': {
        return this.relayClosureEgress(
          new JsonEngine(
            this._username,
            this._password
          ),
          parameters
        )
      }
    }
  }
}

export default ApiController;

