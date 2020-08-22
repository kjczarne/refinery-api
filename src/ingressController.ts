import iBooks2Refinery from './ingress/iBooks';
import yargs from 'yargs';

const argv = yargs.option(
  'book', {
    type: 'string',
    demandOption: true
  }
).argv;

iBooks2Refinery(
  argv.book
);
