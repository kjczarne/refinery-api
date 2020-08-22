// use process.argv here, first two args are the node command elements (node, script path)
import andevFlashcards from './egress/andevFlashcards';
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
    }
  }
).argv;

switch (argv.what) {
  case 'andev':
    andevFlashcards(
      argv.path,
      argv.deck,
      argv.notebook,
      '',
      argv.flipped
    );
  case 'md': {
    // TODO: MD summaries
  }
}

