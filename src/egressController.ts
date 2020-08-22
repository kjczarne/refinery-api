// use process.argv here, first two args are the node command elements (node, script path)
import relay from './egressRelay';
import AndevEngine from './handlers/andevFlashcards';
import MdEngine from './handlers/markdown';
import yargs from 'yargs';

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
    deck: {
      type: 'string',
      demandOption: true
    },
    notebook: {
      type: 'string',
      demandOption: true
    },
    diff: {
      type: 'boolean',
      demandOption: false,
      default: true
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

switch (argv.what) {
  case 'andev':
    relay(
      new AndevEngine(),
      argv.path,
      argv.deck,
      argv.notebook,
      '',
      argv.flipped
    );
  case 'md': {
    relay(
      new MdEngine(),
      argv.path,
      argv.deck,
      argv.notebook,
      '',
      argv.flipped
    )
  }
}

