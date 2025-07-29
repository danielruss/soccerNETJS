
![SOCcerNET](./soccernetLogo1.svg) 

SOCcerNET is an occupational autocoding classifier build on huggingface text emedding 
model. 

## Using SOCcerNET in your application

### import SOCcerNET via NPM
```
npm install @danielruss/soccernet
```

### importing SOCcerNET via CDN
```
<script>
import * as soccerNet from "https://cdn.jsdelivr.net/npm/@danielruss/soccernet@latest/+esm"
</script>
```
or in the developers panel of the browser you can use: 

```
const soccerNet=await import("https://cdn.jsdelivr.net/npm/@danielruss/soccernet@latest/+esm")
```

### Running SOCcerNET
In order to run SOCcerNET, you first must configure the version.  Under the hood, SOCcerNET is SOCcer v3, so to configure with version 3.0.0.
```
let config = soccerNet.configureSOCcerNet("3.0.0");
```

Since this is the only available version, it is the default and can be left out.
```
let config = soccerNet.configureSOCcerNet();
```

After configuration, the job descriptions can be coded.  SOCcerNET expect an input object that looks like:
```
{
    JobTitle: plumber,
    JobTask: fix leaks in homes
    soc 1980: 645
}
```

The results are an array where each entries is a job description.  Since there is only 1 job in the example there is only one job in the results. An id will be added because in this example one is not given. 

```
<script>
import * as soccerNet from "https://cdn.jsdelivr.net/npm/@danielruss/soccernet@latest/+esm"

const inputObject = {
    JobTitle: "plumber",
    JobTask: "fix leaks in homes",
    soc1980: "645"
}

let config = await soccerNet.configureSOCcerNet();
let results = await soccerNet.runSOCcerPipeline(inputObject,config)
</script>
```


The results are:
```
[{
    Id: "row-1"
    JobTask: "fix leaks in homes"
    JobTitle: "plumber"
    score:[0.9806628823280334,0.012618162669241428,0.007014638744294643,0.006607372779399157,0.006477011367678642,0.005545503459870815,0.002995521994307637,0.001819823868572712,0.001284098019823432,0.0007829691166989505]
    soc1980: "645",
    soc2010: ["47-2152","47-2061","47-1011","49-9099","47-3015","49-9071","47-4099","47-2031","37-2012","37-2011"],
    title:["Plumbers, Pipefitters, and Steamfitters","Construction Laborers","First-Line Supervisors of Construction Trades and Extraction Workers","Installation, Maintenance, and Repair Workers, All Other", "Helpers--Pipelayers, Plumbers, Pipefitters, and Steamfitters","Maintenance and Repair Workers, General","Construction and Related Workers, All Other","Carpenters","Maids and Housekeeping Cleaners","Janitors and Cleaners, Except Maids and Housekeeping Cleaners"]
}]
```

Take a look at  provide [a more complicated file upload/download version with progress]( https://danielruss.github.io/soccernet_example/) here is the [html](https://github.com/danielruss/soccernet_example/blob/main/index.html) and the [javascript](https://github.com/danielruss/soccernet_example/blob/main/browser.js) that drives it.

