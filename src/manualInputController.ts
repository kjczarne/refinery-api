import readline from 'readline';
import { constructRecord } from './engine';
import BaseEngine from './handlers/baseHandler';
import { IRecord } from './interfaces';

// read in an endless loop until SIGKILL
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var notebook: string;
var set: string;

rl.question('Specify notebook: ', (nb) => {
  notebook = nb;
  rl.question('Specify set: ', (s) => {
    set = s;
    rl.close();
  });
})

while (true) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('DF1: ', (df1) => {
    // TODO: Log the answer in a database
    rl.question('DF2: ', (df2) => {
      rl.question('Note: ', async (note)=> {
        let rec = constructRecord(df1, df2, "CLI", undefined, undefined, set, notebook, undefined, note);
        let wrapped = new Array<IRecord>(rec);
        let response = await new BaseEngine().importCallback(wrapped);
        console.log(`Written as doc: ${response}`);
        rl.close();
      })
    })
  });
}
