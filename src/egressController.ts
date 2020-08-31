#!/usr/bin/env node
// use process.argv here, first two args are the node command elements (node, script path)
import relay from './egressRelay';
import AndevEngine from './engines/andevFlashcards';
import MdEngine from './engines/markdown';
import JsonEngine from './engines/json';
import yargs from 'yargs';
import { DEFAULT_CONFIG_PATH } from './configProvider';
import BaseEngine from './engines/baseEngine';

const argv = yargs.options(
  {
    what: {
      type: 'string',
      demandOption: true,
      choices: [
        'md', 'andev'
      ]
    },
    path: {
      type: 'string',
      demandOption: true
    },
    batch: {
      type: 'string',
      demandOption: true
    },
    notebook: {
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
    config: {
      type: 'string',
      demandOption: false
    }
  }
).argv;

if (argv.config !== undefined) {
  var config = argv.config;
} else {
  var config = DEFAULT_CONFIG_PATH
}

const relayClosure = (engine: BaseEngine) => {
  relay(
    engine,
    argv.path,
    argv.batch,
    argv.notebook,
    argv.diff,
    argv.flipped
  );
}

switch (argv.what) {
  case 'andev':
    relayClosure(
      new AndevEngine(config),
    );
  case 'md': {
    relayClosure(
      new MdEngine(config),
    )
  }
  case 'json': {
    relayClosure(
      new JsonEngine(config),
    )
  }
}

