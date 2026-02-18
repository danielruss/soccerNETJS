console.log(".. in test/io_test.js ..")

import mocha from 'https://cdn.jsdelivr.net/npm/mocha@10.7.3/+esm'
import { assert } from 'https://cdn.jsdelivr.net/npm/chai@5.1.1/+esm'
import { read_csv,read_excel } from 'https://cdn.jsdelivr.net/npm/@danielruss/clips/+esm'
import { configureSOCcerNet, runSOCcerPipeline } from '../dist/browser/soccerNET.js'
mocha.setup('bdd')

describe('Read Excel', function() {
    it('should read the excel file', async function(){
        const url = "../dev/gemini-jobs.xlsx";
        let excelBlob = await (await fetch(url)).arrayBuffer() 
        let dta = await read_excel(excelBlob)
        assert.isNotNull(dta, "Data is not null")
        assert.equal(dta.data[0].Id, "GEMINI-01", "Incorrect Id")
        assert.equal(dta.data[0].JobTask, "Develop and maintain software applications.", "Incorrect JobTitle")
    })
});

describe('Read CSV', function() {
    it('should read the CSV file', async function(){
        const url = "../dev/gemini-jobs.csv";
        let csvBlob = await (await fetch(url)).blob() 
        let dta = await read_csv(csvBlob)
        assert.isNotNull(dta, "Data is not null")
        assert.equal(dta.data[0].Id, "GEMINI-01", "Incorrect Id")
        assert.equal(dta.data[0].JobTask, "Develop and maintain software applications.", "Incorrect JobTitle")
    })
});

describe('Configure SOCcerNET', function() {
    it('should configure SOCcerNET', async function() {
        this.slow(300000)
        try {            
            let config = await configureSOCcerNet();
            assert.isNotNull(config, "Config is not null")
            assert.isNotNull(config.session, "Session is not null")
            assert.equal(config.model_version, "3.0.0", "Model version should be 3.0.0")
        } catch (error) {
            console.error("Configuration failed:", error);
            assert.fail("Configuration failed: " + error.message);
        }
    });
});

describe('Run SOCcerNET', function() {
    it('should match the toy version with GEMINI-01',async function(){
        this.slow(300000)
        let data={JobTitle:"Software Engineer", JobTask:"Develop and maintain software applications."};
        let config = await configureSOCcerNet("3.0.0");
        console.log(".. in test/io_test.js ..")
        let results = await runSOCcerPipeline(data, config,{n:2});
        let expected = [
            {soc2010: ['15-1132', '15-1133'], score: [0.9806, 0.3603] },
        ]
        assertResultsMatch(results,expected)
    })

    it('should match the Toy version with the dev file', async function(){
        this.slow(20000)
        const url = "../dev/gemini-jobs.csv";
        let csvBlob = await (await fetch(url)).blob() 
        let dta = await read_csv(csvBlob)
        assert.isNotNull(dta, "Data is not null")
        assert.equal(dta.data[0].Id, "GEMINI-01", "Incorrect Id")
        assert.equal(dta.data[0].JobTask, "Develop and maintain software applications.", "Incorrect JobTitle")

        let config = await configureSOCcerNet();
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

mocha.run();