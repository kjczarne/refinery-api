import relay from './ingressRelay';
import { AppleiBooksEngine } from './handlers/iBooks';
import yargs from 'yargs';

const argv = yargs.option(
  'book', {
    type: 'string',
    demandOption: true
  }
).argv;

relay(
  new AppleiBooksEngine(),
  argv.book
);
