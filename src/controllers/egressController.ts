#!/usr/bin/env node
// use process.argv here, first two args are the node command elements (node, script path)
import relay from '../relays/egressRelay';
import AndevEngine from '../engines/andevFlashcards';
import MdEngine from '../engines/markdown';
import JsonEngine from '../engines/json';
import yargs from 'yargs';
import { DEFAULT_CONFIG_PATH } from '../configProvider';
import BaseEngine from '../engines/baseEngine';
import { BaseController } from './baseController';

const baseCtl = new BaseController();

const argv = yargs.options(
  {
    what: baseCtl.whatEgress,
    path: {
      type: 'string',
      demandOption: true
    },
    diff: {
      type: 'number',
      demandOption: false,
      default: undefined
    },
    flipped: {
      type: 'boolean',
      demandOption: false,
      default: false
    },
    ...baseCtl.commonOptions
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
    argv.path,
    <string>argv.batch,
    <string>argv.notebook,
    argv.diff,
    argv.flipped
  );
}

// the following finds the correct engine based on argv.what
// and relays instantiation and Egress call
let idx = baseCtl.allEngineNames.findIndex((val)=>{return val === <string>argv.what});
relayClosure(
  new baseCtl.allEngines[idx](<string>argv.user, <string>argv.password, config)
);

