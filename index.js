// Set options as a parameter, environment variable, or rc file.
// eslint-disable-next-line no-global-assign
import fs from 'fs';
import * as SOCcerNET from './src/soccerNET.mjs';
import { read_csv } from '@danielruss/clips'


let optional_config = {};
if (process.env.MODEL_URL){
    if (!fs.existsSync(process.env.MODEL_URL)){
        console.error(`ERROR: The model file, ${process.env.MODEL_URL}, does not exist.`);
        process.exit(1);
    }
    optional_config.model_url = process.env.MODEL_URL
}else {
    console.log("... By the way.  You did not define the environment varible MODEL_URL.  This will use the model located online.")
}
let config = await SOCcerNET.configureSOCcerNet("3.0.0",optional_config)

// this is node-specific..
let data = await read_csv(fs.createReadStream('./dev/gemini-jobs.csv'));
let results = await SOCcerNET.runSOCcerPipeline(data,config);
console.log(results)

data = await read_csv(fs.createReadStream('./dev/gemini-jobs-notask.csv'));
results = await SOCcerNET.runSOCcerPipeline(data,config);
console.log(results)
