import { device, ort, pipelineInit, embedData, Crosswalk, CodingSystem } from '@danielruss/clips';
import { soccerConfig } from './config_soccer.mjs'
import { abbrev } from './abbrev.mjs';
export { getFileIterator, createOPFSWritableStream,writeResultsBlockToOPFS, 
    closeOPFSStream,downloadResultsFromOPFS } from '@danielruss/clips'

// note: this is the SOCcer version SOCcerNET 1 == SOCcer 3
export async function configureSOCcerNet(version = "3.0.0") {
    let current_config = { ...soccerConfig[version] };
    current_config.device = device;
    await pipelineInit(current_config)

    // add the session to the current_config and return it...
    let current_model = current_config.model_url;
    current_model = await (await fetch(current_model)).arrayBuffer()
    current_config.session = await ort.InferenceSession.create(current_model, { executionProviders: [device] })

    return current_config
}

export async function runSOCcerPipeline(input_data, current_config, { n = 10 } = {}) {
    if (!input_data) throw new Error("No data to classify");
    if (!current_config) throw new Error("No clips configuration, did you forget to call or await configureClips? ");
    if (!current_config?.session) throw new Error("There is no session in the current config!")

    let metadata = {
        start_time: new Date().toLocaleString(),
        embedding_model: current_config.model,
        clips_model: current_config.model_version,
        coding_system: "soc2010"
    }

    // Step 1. preprocess the data
    let { data, fields } = cleanData(input_data)

    // Step 2. embed the data
    let embeddings = await embedData(data.JobTitleTask)
    const embedding_tensor = new ort.Tensor('float32',embeddings.data, embeddings.dims);

    // Step 3. Handle the crosswalking (soc2010 has 840 6-digit codes.)
    let soc1980_soc2010 = await Crosswalk.loadCrosswalk("soc1980","soc2010")
    let crosswalk_buffer = soc1980_soc2010.createBuffer(data.length)
    if (Object.hasOwn(data,"soc1980")){
        soc1980_soc2010.bufferedCrosswalk(data['soc1980'],crosswalk_buffer)
    }
    if (Object.hasOwn(data,"noc2011")){
        let noc2011_soc2010 = await Crosswalk.loadCrosswalk("noc2011","soc2010")
        noc2011_soc2010.bufferedCrosswalk(data['noc2011'],crosswalk_buffer)
    }
    if (Object.hasOwn(data,"isco1988")){
        let isco1988_soc2010 = await Crosswalk.loadCrosswalk("isco1988","soc2010")
        isco1988_soc2010.bufferedCrosswalk(data['isco1988'],crosswalk_buffer)
    }
    const crosswalk_tensor = new ort.Tensor('float32',crosswalk_buffer, crosswalk_buffer.dims);

    // the onnx model is loaded during configiuration
    // Step 4. run the onnx model
    const feeds = {
        embedded_input: embedding_tensor,
        crosswalked_inp: crosswalk_tensor
    }
    // Step 5. run the onnx model
    let results = await current_config.session.run(feeds);

    // Step 6. process the results.
    results = onnxResultToArray(results.soc2010_out);

    // Step 7. get top N results...
    let soc2010 = await CodingSystem.loadCodingSystem('soc2010')
    results=results.map( (job)=>topK(job,n,soc2010) )

    // Step 8. add the input data to the results
    results.input_fields = fields
    results.map( (res,index) => {
        fields.forEach(key => res[key]=data[key][index] )
        return res
    })

    // Step 9: add metadata to the results
    metadata.end_time=new Date().toLocaleString()
    results.metadata = metadata;
    results.blockId = input_data?.meta?.blockId??0
    
    return results
}

function cleanData(data) {
    let fields;
    let initialLine=0;

    // either we have data from a papaparse like output
    // or a bare array of objects (or just one object)
    if ( Object.hasOwn(data,"data") && Object.hasOwn(data,"meta") && Object.hasOwn(data.meta,"fields")){
        fields = data.meta.fields
        initialLine = data.meta?.lines ?? 0
        data = data.data;
    } else {
        if (!Array.isArray(data)) data=[data];
        fields = Object.keys(data[0])
    }

    // if I have to add an ID it will be of the form soccer-001 where
    // npad is the number of digits
    let npad=  Math.floor(Math.log10(data.length))+1;
    let initial_object = fields.reduce( (obj,key) => {obj[key]=[];return obj},{})

    // transpose the data to a column array.
    let cleanedData =  data.reduce( (acc,cv,indx)=>{
        fields.forEach(k => acc[k].push(cv[k]??''))
        acc.length = indx+1
        return acc
    },initial_object)

    // guarantee that the jobs have an id and a job task
    if (!Object.hasOwn(cleanedData,"Id")){
        fields.unshift("Id")
        cleanedData['Id'] = Array.from({length:cleanedData.length},(_,indx)=>`row-${Number(initialLine+indx+1).toString().padStart(npad,"0")}`)
    }
    if (!Object.hasOwn(cleanedData,"JobTask")){
        cleanedData['JobTask'] = new Array(cleanedData.length).fill('')
    }

    // remove any any whitespace dashes and periods at the end of the job title or task
    // and replace any abbreviations in the job title and task
    cleanedData.JobTitle = cleanedData.JobTitle.map( (text) => preprocess_clean_text(text));
    cleanedData.JobTask = cleanedData.JobTask.map( (text) => preprocess_clean_text(text));

    // combine the job title and job task
    cleanedData.JobTitleTask = cleanedData.JobTitle.map( (text,indx) => `${text} ${cleanedData.JobTask[indx]}`.trim())

    return {
        data: cleanedData,
        fields: fields
    }
}

function onnxResultToArray(tensor) {
    const [rows, cols] = tensor.dims;
    const data = Array.from(tensor.cpuData);

    return Array.from({ length: rows }, (_, i) => data.slice(i * cols, i * cols + cols));
}

function topK(arr, k, codingSystem) {
    // Set k to the length of the array if k is greater than the array length
    k = Math.min(k, arr.length)

    // Create an array of indices and sort it based on the values in arr
    const indices = Array.from(arr.keys()).sort((a, b) => arr[b] - arr[a]);

    // Get the top k values and their indices
    const topIndices = indices.slice(0, k);
    const topValues = topIndices.map(i => arr[i]);

    const topObjects = codingSystem.fromIndices(topIndices)
    const {topCodes,topLabels} = topObjects.reduce( (acc,cv) =>{
        acc['topCodes'].push(cv.code)
        acc['topLabels'].push(cv.title)
        return acc
    },{topCodes:[],topLabels:[]})


    return { soc2010: topCodes, title: topLabels, score: topValues };
}

function preprocess_clean_text(txt) {
    // remove any whitespace dashes and periods at the end of the job title or task    
    txt = txt.replaceAll(/^[\s\-\.]+|[\s\-\.]+$/g, "").toLowerCase();
    // replace any abbreviations in the job title and task
    return Object.hasOwn(abbrev,txt)? abbrev[txt] : txt

}