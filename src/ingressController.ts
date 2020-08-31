#!/usr/bin/env node
import relay from './ingressRelay';
import { AppleiBooksEngine } from './engines/iBooks';
import { MdEngine } from './engines/markdown';
import { DEFAULT_CONFIG_PATH } from './configProvider';
import yargs from 'yargs';

const argv = yargs.options(
  {
    what: {
      type: 'string',
      demandOption: true,
      choices: [
        'md', 'ibooks'
      ]
    },
    batch: {
      type: 'string',
      demandOption: false
    },
    notebook: {
      type: 'string',
      demandOption: false
    },
    book: {
      type: 'string',
      demandOption: false
    },
    config: {
      type: 'string',
      demandOption: false
    },
    file: {
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

switch (argv.what) {
  case 'ibooks': {
    if (argv.book !== undefined) {
      relay(
        new AppleiBooksEngine(config),
        argv.book,
        argv.batch,
        argv.notebook
      );
    } else {
      console.log("Error: `book` argument expected");
    }
    break;
  }
  case 'md': {
    if (argv.file !== undefined) {
      relay(
        new MdEngine(config),
        argv.file,
        argv.batch,
        argv.notebook
      );
    } else {
      console.log("Error: `file` argument expected");
    }
  }
}
