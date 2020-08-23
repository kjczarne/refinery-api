// use process.argv here, first two args are the node command elements (node, script path)
import relay from './egressRelay';
import AndevEngine from './handlers/andevFlashcards';
import MdEngine from './handlers/markdown';
import yargs from 'yargs';
import { DEFAULT_CONFIG_PATH } from './configProvider';

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
    set: {
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

switch (argv.what) {
  case 'andev':
    relay(
      new AndevEngine(config),
      argv.path,
      argv.set,
      argv.notebook,
      argv.diff,
      argv.flipped
    );
  case 'md': {
    relay(
      new MdEngine(config),
      argv.path,
      argv.set,
      argv.notebook,
      argv.diff,
      argv.flipped
    )
  }
}

