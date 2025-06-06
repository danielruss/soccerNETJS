// Set options as a parameter, environment variable, or rc file.
// eslint-disable-next-line no-global-assign
import fs from 'fs';
import * as SOCcerNET from './dist/node/soccerNET.js';
import { ort,read_csv } from '@danielruss/clips'

console.log(ort)
let config = await SOCcerNET.configureSOCcerNet()

// this is node-specific..
let data = await read_csv(fs.createReadStream('./dev/gemini-jobs.csv'));
let results = await SOCcerNET.runSOCcerPipeline(data,config);
console.log(results)

data = await read_csv(fs.createReadStream('./dev/gemini-jobs-notask.csv'));
results = await SOCcerNET.runSOCcerPipeline(data,config);
console.log(results)