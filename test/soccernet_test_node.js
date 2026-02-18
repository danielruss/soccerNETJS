import { assert } from 'chai';
import { read_csv } from '@danielruss/clips'
import  { configureSOCcerNet, runSOCcerPipeline } from '../src/soccerNET.mjs';

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function assertResultsMatch(results,expected){
    assert.lengthOf(results,expected.length, "Results length does not match expected length")

    for (let i=0; i<results.length; i++){
        let actualJob = results[i];
        let expectedJob = expected[i];
        let n = Math.min(actualJob.soc2010.length,expectedJob.soc2010.length);

        const actualCodes = actualJob.soc2010.slice(0,n);
        const actualScores = actualJob.score.slice(0,n);
        const expectedCodes = expectedJob.soc2010.slice(0,n);
        const expectedScores = expectedJob.score.slice(0,n);

        actualCodes.forEach( (code,index) => assert.equal(code,expectedCodes[index],`soc2010_${index+1} does not match`))
        actualScores.forEach( (score,index) => assert.closeTo(score,expectedScores[index],0.01,`score_${index+1} does not match`))
     }    
}


describe('Read CSV', function() {
    it('should read the CSV file', async function(){
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const csvPath = join(__dirname,"..","dev","gemini-jobs.csv")
        const csvText = await readFile(csvPath, 'utf8');

        let dta = await read_csv(csvText)
        assert.isArray(dta.data, "Data should an array")
        assert.isAtLeast(dta.data.length, 1, "CSV should have at least one row");
        assert.equal(dta.data[0].Id, "GEMINI-01", "Incorrect Id")
        assert.equal(dta.data[0].JobTask, "Develop and maintain software applications.", "Incorrect JobTitle")
    })
});

describe('Run SOCcerNET', function() {
    let optional_config={};

    before( function(){
        if (process.env.MODEL_URL){
            if (!existsSync(process.env.MODEL_URL)){
                console.error(`ERROR: The model file, ${process.env.MODEL_URL}, does not exist.`);
                process.exit(1);
            }
            optional_config.model_url = process.env.MODEL_URL
            console.log(`... Using model: ${optional_config.model_url}`)
        }else {
            console.log("... By the way.  You did not define the environment varible MODEL_URL.  This will use the model located online.")
        }
    });

    it('should match the python version with GEMINI-01',async function(){
        let data={JobTitle:"Software Engineer", JobTask:"Develop and maintain software applications."};
        let config = await configureSOCcerNet("3.0.0",optional_config);
        console.log(".. in test/io_test.js ..")
        let results = await runSOCcerPipeline(data, config,{n:2});
        let expected = [
            {soc2010: ['15-1132', '15-1133'], score: [0.9806, 0.3603] },
        ]
        assertResultsMatch(results,expected)
    })

    it('should match the python version with the dev file', async function(){
        // load the data to run ...
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const csvPath = join(__dirname,"..","dev","gemini-jobs.csv")
        const csvText = await readFile(csvPath, 'utf8');
        let dta = await read_csv(csvText)

        assert.isNotNull(dta, "Data should not be null null")
        assert.isArray(dta.data, "Data should an array")
        assert.isAtLeast(dta.data.length, 1, "Data should have at least one row");
        assert.equal(dta.data[0].Id, "GEMINI-01", "Incorrect Id")
        assert.equal(dta.data[0].JobTask, "Develop and maintain software applications.", "Incorrect JobTitle")

        // config and run...
        let config = await configureSOCcerNet("3.0.0",optional_config)        
        assert.isNotNull(config, "Config is not null")
        assert.isNotNull(config.session, "Session is not null")

        let results = await runSOCcerPipeline(dta,config,{n:2});
        let expected = [
            {soc2010: ['15-1132', '15-1133'], score: [0.9806, 0.3603] },
            {soc2010: ['13-1161', '11-2021'], score: [0.9653, 0.9495] },
            {soc2010: ['43-4161', '13-1141'], score: [0.5050, 0.4739] },
            {soc2010: ['13-2051', '43-3031'], score: [0.9655, 0.0524] },
            {soc2010: ['11-9021', '15-1133'], score: [0.0311, 0.0228] },
            {soc2010: ['43-4051', '43-4171'], score: [0.9821, 0.0528] },
            {soc2010: ['17-2131', '17-2171'], score: [0.0909, 0.0795] },
            {soc2010: ['27-1024', '27-1014'], score: [0.9978, 0.8402] },
            {soc2010: ['15-1199', '15-1121'], score: [0.2538, 0.1778] },
            {soc2010: ['43-6014', '43-9061'], score: [0.9712, 0.4237] }
        ]
        assertResultsMatch(results,expected)
    })
});