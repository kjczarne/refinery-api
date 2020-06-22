// use process.argv here, first two args are the node command elements (node, script path)
import iBooks2Refinery from './adapters/iBooks2Refinery';
// import iBooks2Anki from './adapters/iBooks2Anki';

switch (process.argv[2]){
    case 'ibooks':
        iBooks2Refinery(
            process.argv[3]
        );
        break;
    // case 'ibooks-anki':
    //     iBooks2Anki(
    //         process.argv[3],  // book name (input)
    //         process.argv[4],  // deck name (output)
    //         process.argv[5]   // optional: APKG path (output)
    //     );
    //     break;
    default:
        console.log("Called with wrong arguments!");
}