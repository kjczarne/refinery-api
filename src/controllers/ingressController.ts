#!/usr/bin/env node
import relay from '../relays/ingressRelay';
import { BaseEngine } from 'refinery-core';
import { DEFAULT_CONFIG_PATH } from 'refinery-core';
import yargs from 'yargs';
import { BaseController } from './baseController';

const baseCtl = new BaseController();

const argv = yargs.options(
  {
    what: baseCtl.whatIngress,
    resource: {
      type: 'string',
      demandOption: false
    }
  }
).argv;

if (argv.config !== undefined) {
  var config = <string>argv.config;
} else {
  var config = DEFAULT_CONFIG_PATH
}

const relayClosure = (engine: BaseEngine) => {
  relay(
      engine,
      <string>argv.resource,
      <string>argv.batch,
      <string>argv.notebook
  );
}

let idx = baseCtl.allEngineNames.findIndex((val)=>{return val === <string>argv.what});
relayClosure(
  new baseCtl.allEngines[idx](<string>argv.user, <string>argv.password, config)
);
