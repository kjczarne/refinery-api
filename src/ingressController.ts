import relay from './ingressRelay';
import { AppleiBooksEngine } from './handlers/iBooks';
import { DEFAULT_CONFIG_PATH } from './configProvider';
import yargs from 'yargs';

const argv = yargs.options(
  {
    book: {
      type: 'string',
      demandOption: true
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

relay(
  new AppleiBooksEngine(config),
  argv.book
);
