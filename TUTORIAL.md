# TUTORIAL 2: Querying workspace data from a custom report

Custom reports are a great way for analyzing and communicating Enterprise Architecture insights of your organization in an effective way.

In this step-by-step tutorial we create a simple [LeanIX](https://www.leanix.net/en/) custom report that demonstrates how to fetch data from the LeanIX workspace using the two methods provided by the LeanIX Reporting API: Facet Filters and GraphQL queries. More specifically, we'll compute the average completion ratio for three factsheet types, *Applications*, *Business Capabilities*, and *IT Components*, and display them as tables, as depicted below.

<div  style="display:flex; justify-content:center">
  <img  src="https://i.imgur.com/rE8fdFg.png">
</div>

The complete source-code for this project can be found [here](https://github.com/pauloramires/leanix-custom-report-tutorial-02).

  

## Pre-requisites

*  [NodeJS LTS](https://nodejs.org/en/) installed in your computer.

## Getting started

Install the [leanix-reporting-cli](https://github.com/leanix/leanix-reporting-cli) globally via npm:

```bash
npm install -g @leanix/reporting-cli
```

Initialize a new project:

```bash
mkdir leanix-custom-report-tutorial-02
cd leanix-custom-report-tutorial-02
lxr init
npm install
```
Configure your environment by editing the *lxr.json* file, if required:
```json
{
  "host": "app.leanix.net",
  "apitoken": "your-api-token-here"
}
```

After this procedure, you should end up with the following project structure:

<div  style="display:flex; justify-content:center">
  <img  src="https://i.imgur.com/VSyEW2h.png">
</div>

## Adjust the report boilerplate source code

We need to make some modifications in our project's boilerplate code. We start by adding the following dependecies:
```bash
npm install --dev @babel/plugin-transform-runtime postcss-loader tailwindcss
npm install alpinejs
```

 **Note:** During the course of this tutorial, we'll be using the [Alpine JS framework]() and [Tailwind CSS](https://tailwindcss.com/). Additional information for these libraries can be found [here](https://github.com/alpinejs/alpine#learn) and [here](https://tailwindcss.com/docs/installation), respectively.

After installing the dependencies, we modify the *webpack.config.js* file and include the *@babel/plugin-transform-runtime* and the *postcss-loader*, as indicated by the red arrows of the picture below:

<div  style="display:flex; justify-content:center;">
  <img  src="https://i.imgur.com/Vn0ZeWK.png">
</div>

 We then clean up our project source code by deleting the unnecessary files:
-  *src/report.js*
-  *src/fact-sheet-mapper.js*
-  *src/assets/bar.css*
-  *src/assets/main.css*

Next we create a *postcss.config.js* file in the *src* folder, with the following content:
```javascript
module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer')
  ]
}
```

  

Additionally we create an *tailwind.css* file in the assets folder with the following content:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
Your project folder should look now like this:
<div  style="display:flex; justify-content:center">
<img  src="https://i.imgur.com/703o0Wx.png">
</div>

Afterwards, edit the *index.js* file as follows, including the [Alpine JS](https://github.com/alpinejs/alpine), [Tailwind CSS](https://tailwindcss.com/) and [leanix-reporting](https://leanix.github.io/leanix-reporting/) dependencies:

```javascript
import 'alpinejs'
import '@leanix/reporting'
import './assets/tailwind.css'

const state = {}

const methods = {
  async initializeReport () {
    console.log('initializing report')
  }
}

window.initializeContext = () => {
  return {
    ...state,
    ...methods
  }
}
```

  

And finally edit the *index.html* file as follows:

```html
<!doctype  html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="application-name" content="leanix-custom-report-tutorial-02">
    <meta name="description" content="Tutorial on how to query workspace data from a custom report">
    <meta name="author" content="LeanIX GmbH">
    <title>Tutorial 02: querying data from workspace</title>
  </head>

  <body x-data="initializeContext()" x-init="initializeReport()">
    <div class="container mx-auto h-screen"></div>
  </body>
</html>
```
As you may have noticed, we have declared row [Alpine JS](https://github.com/alpinejs/alpine#learn) directives in the <code>body</code> tag of our HTML code, the [x-data](https://github.com/alpinejs/alpine#x-data) and the [x-init](https://github.com/alpinejs/alpine#x-init). The  [x-data](https://github.com/alpinejs/alpine#x-data) directive calls the global method *initializeContext*, declared in the *index.js* file, and sets the scope for our report. More specifically, the [x-data](https://github.com/alpinejs/alpine#x-data) directive makes available to our AlpineJS instance all the variables and methods that are declared in the *state* and *methods* attributes of our *index.js* file. On the other hand, the [x-init](https://github.com/alpinejs/alpine#x-init) directive triggers the *initializeReport* method, defined in the *index.js* file, once the report is initialized.

You may start the development server now by running the following command:
```bash
npm start
```
**Note!**

When you run *npm start*, a local webserver is hosted on *localhost:8080*

that allows connections via HTTPS. But since just a development SSL certificate is created the browser might show a warning that the connection is not secure. You could either allow connections to this host anyways, or create your own self-signed certificate: https://www.tonyerwin.com/2014/09/generating-self-signed-ssl-certificates.html#MacKeyChainAccess.

If you decide to add a security exception to your localhost, make sure you open a second browser tab and point it to https://localhost:8080. Once the security exception is added to your browser, reload the original url of your development server and open the development console. Your should see a screen similar to the one below:
<div  style="display:flex; justify-content:center">
  <img  src="https://i.imgur.com/5LoJVX0.png">
</div>
Nothing very exciting happens here... However we notice that our report loads, and triggers the *initializeReport* method as expected!

## Fetching workspace data using Facet Filters
Facet filtering is one of the two ways provided by the [leanix-reporting api](https://leanix.github.io/leanix-reporting/) that can be used to fetch data from a *workspace* into a *custom report*. In this section we'll setup our report so that we can use facet filtering to *compute* the *factsheet count* and *average completion ratio* for three kinds of factsheets in our workspace: Applications, IT Components and Business Capabilities.

### Setting up the report configuration
We edit the *index.js* file and declare the following attributes and methods:
```javascript
const state = {
  factSheetTypes: ['Application', 'ITComponent', 'BusinessCapability'],
  facetResultIndex: {}
}

const methods = {
  async initializeReport () {
    await lx.init()
    const facets = this.factSheetTypes
      .map((factSheetType, key) => ({
        // key is a mandatory item for each facet, defined here simply as the index of our factSheet type in the factSheetTypes array
        key,
        // the factsheet type of our facet
        fixedFactSheetType:  factSheetType,
        // The attributes we want to fetch in our query
        attributes: ['completion{completion}'],
        // The function that will be triggered after the report is loaded and everytime the user sets a new filter
        callback: factSheets  => {
	  // for the current factsheetType, compute the count of factsheets
          const factSheetCount = factSheets.length
          // and the averate completion ratio, defined as the sum of all factsheet completion rations divided by the factsheet count
          const averageCompletion = ((factSheets
          .reduce((accumulator, { completion }) =>  accumulator += completion.completion, 0) / factSheetCount) * 100).toFixed(2) + '%'
	  // build the facet query result for this factsheet type as an array of the translated factsheet type name, the factsheet count and the average completion ratio
          const facetResult = [
            lx.translateFactSheetType(factSheetType, 'plural'),
            factSheetCount,
            averageCompletion
          ]
	  // and store the result in our facetResultIndex
          this.facetResultIndex = { ...this.facetResultIndex, [factSheetType]:  facetResult }
        }
      }))
    // build our report configuration object containing only the facets attribute
    const config = { facets }
    // and set the report configuration
    await lx.ready(config)
  }
}
```
The *factSheetTypes* array define the three factsheet types that we'll analyse in our report. We'll hold the result of our completion analysis in the *facetResultIndex* object. Moreover, we configure our report using the *initializeReport* method. We define a facet for each factsheet type that was previously defined. The complete documentation for the **leanix-reporting api** can be found [here](https://leanix.github.io/leanix-reporting/).

### Adjusting the report view to show the results
In order to visualize the result, we adapt the <code>body</code> tag of our *index.html* file as follows:
```html
<body x-data="initializeContext()" x-init="initializeReport()">
  <div class="container mx-auto h-screen">
    <div class="flex flex-wrap items-start justify-center">
      <div class="flex flex-col items-center">
        <span class="text-3xl font-bold uppercase py-4" x-text="'Facets'"></span>
        <pre x-text="JSON.stringify(facetResultIndex, null, 2)"></pre>
      </div>
    </div>
  </div>
</body>
```

Your report should now display the **factSheetTypeIndex** that was built from our three facets, displayed in a pretty format:
<div style="display:flex; justify-content:center">
  <img src="https://i.imgur.com/9mP76aS.png">
</div>

### Filtering and bookmarking
Filtering and bookmarking with Facet Filters is done out of the box, using the standard LeanIX Pathfinder controls and without requiring any modifications in the custom report source code.
Filtering is done via the navigation panel on the left, by selecting the **Filter** tab and any combination of facets displayed below.
<div style="display:flex; justify-content:center">
  <img src="http://i.imgur.com/DxMuhqn.png">
</div>

Once you set a combination of *facet filters* in your report, you can **bookmark** them by clicking on the **"Save as"** button on the top right corner and fill out the form details. Your bookmark will then be listed as a new report under the **Reports** tab of the left navigation column of the LeanIX Pathfinder application.
<div style="display:flex; justify-content:center">
  <img src="https://i.imgur.com/T8XPbCc.png">
</div>

## Fetching workspace data using GraphQL queries
Another way to fetch data from a workspace into a custom report is by using the [lx.executeGraphQL](https://leanix.github.io/leanix-reporting/classes/lxr.lxcustomreportlib.html#executegraphql) method provided by the [leanix-reporting api](https://leanix.github.io/leanix-reporting/classes/lxr.lxcustomreportlib.html). Unlike the Facet Filter method we've seen before, which allows only data to be read from your workspace, the [lx.executeGraphQL](https://leanix.github.io/leanix-reporting/classes/lxr.lxcustomreportlib.html#executegraphql) method allows also to mutate the workspace data. However, the integration of this method with the standard filtering and bookmarking controls is not out of the box like the Facet Filters method seen before. Nevertheless, it can be done with a special technique in our custom report, as we'll see ahead.

### Setting up the report configuration
We edit the *index.js* file and declare the a new attribute <code>graphQLResultIndex</code> in the *state*, and a new method <code>fetchGraphQLData</code> in the *methods* object:
```javascript
const state = {
  factSheetTypes: ['Application', 'ITComponent', 'BusinessCapability'],
  facetResultIndex: {},
  // the new state variable graphQLResultIndex
  graphQLResultIndex: {}
}
const methods: {
  async initializeReport () {
    ...
  },
  // the new method fetchGraphQLData
  async fetchGraphQLData (factSheetType) {
    const query = 'query($factSheetType:FactSheetType){allFactSheets(factSheetType:$factSheetType){edges{node{completion{completion}}}}}'
    const queryResult = await lx.executeGraphQL(query, { factSheetType })
      .then(({ allFactSheets }) => {
        const factSheets = allFactSheets.edges.map(({ node }) =>  node)
        const factSheetCount = factSheets.length
        const averageCompletion = ((factSheets.reduce((accumulator, { completion }) =>  accumulator += completion.completion, 0) / factSheetCount) * 100).toFixed(2) + '%'
        return [
          lx.translateFactSheetType(factSheetType, 'plural'),
          factSheetCount,
          averageCompletion
        ]
      })

    this.graphQLResultIndex = { ...this.graphQLResultIndex, [factSheetType]:  queryResult }
  }
}
```
Now we just need to trigger the <code>fetchGraphQLData</code> in our report, so that it populates the <code>graphQLResultIndex</code> with data. We do so by including in the [x-init](https://github.com/alpinejs/alpine#x-init) directive of our html code 3 calls for it, one for each factsheet type defined in the *factSheetTypes* array. We also a new element in our html code for displaying the <code>graphQLResultIndex</code> object.

```html
<!doctype  html>
<body x-data="initializeContext()" x-init="initializeReport(); factSheetTypes.forEach(factSheetType => fetchGraphQLData(factSheetType))">
  <div class="container mx-auto h-screen">
    <div class="flex flex-wrap items-start justify-center -mx-8 ">
      <div class="flex flex-col items-center px-8">
        <span class="text-3xl font-bold uppercase py-4" x-text="'Facets'"></span>
        <pre x-text="JSON.stringify(facetResultIndex, null, 2)"></pre>
      </div>
      <div class="flex flex-col items-center px-8">
        <span class="text-3xl font-bold uppercase py-4" x-text="'GraphQL'"></span>
        <pre x-text="JSON.stringify(graphQLResultIndex, null, 2)"></pre>
      </div>
    </div>
  </div>
</body>
```
Our report now should look like this:
<div style="display:flex; justify-content:center">
  <img src="https://i.imgur.com/ZaHJ8vb.png">
</div>

As you can verify, the results provided by Facets and GraphQL are identical. However, if you try to apply a filter, you'll notice that only the Facets column changes. This happens because, as you may recall, we are only triggering the <code>fetchGraphQLData</code> method once the report loads through the [x-init](https://github.com/alpinejs/alpine#x-init) directive of our <code>body</code> tag, and therefore, not reacting to any subsequent changes in the filters. However, the [leanix-reporting api](https://leanix.github.io/leanix-reporting/) provides a way of **listening to filter changes and trigger a callback** through the facet configuration property [facetFiltersChangedCallback](https://leanix.github.io/leanix-reporting/interfaces/lxr.reportfacetsconfig.html#facetfilterschangedcallback) . We'll adapt then our source code to make our graphQL queries reactive to changes in filters.

First we modify our *initializeReport* method in the *index.js* file to include the [facetFiltersChangedCallback](https://leanix.github.io/leanix-reporting/interfaces/lxr.reportfacetsconfig.html#facetfilterschangedcallback), and the *fetchGraphQLData* method to accept an extra input parameter, the *filter*, and map it in accordance to the GraphQL API so that it can be used to query filtered data.
```javascript
const methods = {
  async initializeReport () {
    await lx.init()
    const facets = this.factSheetTypes
      .map((factSheetType, key) => ({
        // key is a mandatory item for each facet, defined here simply as the index of our factSheet type in the factSheetTypes array
        key,
        // the factsheet type of our facet
        fixedFactSheetType:  factSheetType,
        // The attributes we want to fetch in our query
        attributes: ['completion{completion}'],
        // the callback for changes in the facet filter
        facetFiltersChangedCallback:  filter  =>  this.fetchGraphQLData(factSheetType, filter)
        // The function that will be triggered after the report is loaded and everytime the user sets a new filter
        callback: factSheets  => {
	  // for the current factsheetType, compute the count of factsheets
          const factSheetCount = factSheets.length
          // and the averate completion ratio, defined as the sum of all factsheet completion rations divided by the factsheet count
          const averageCompletion = ((factSheets
          .reduce((accumulator, { completion }) =>  accumulator += completion.completion, 0) / factSheetCount) * 100).toFixed(2) + '%'
	  // build the facet query result for this factsheet type as an array of the translated factsheet type name, the factsheet count and the average completion ratio
          const facetResult = [
            lx.translateFactSheetType(factSheetType, 'plural'),
            factSheetCount,
            averageCompletion
          ]
	  // and store the result in our facetResultIndex
          this.facetResultIndex = { ...this.facetResultIndex, [factSheetType]:  facetResult }
        }
      }))
    // build our report configuration object containing only the facets attribute
    const config = { facets }
    // and set the report configuration
    await lx.ready(config)
  },
  async fetchGraphQLData (factSheetType, filter) {
    // Destructing assignment of filter object with alias for facets and fullTextSearch attributes
    const { facets: facetFilters, fullTextSearchTerm: fullTextSearch, directHits } = filter
    const mappedFilter = { facetFilters, fullTextSearch, ids:  directHits.map(({ id }) =>  id) }
    const query = 'query($filter:FilterInput){allFactSheets(filter:$filter){edges{node{completion{completion}}}}}'
    const queryResult = await lx.executeGraphQL(query, { filter: mappedFilter })
      .then(({ allFactSheets }) => {
        const factSheets = allFactSheets.edges.map(({ node }) =>  node)
        const factSheetCount = factSheets.length
        const averageCompletion = ((factSheets.reduce((accumulator, { completion }) =>  accumulator += completion.completion, 0) / factSheetCount) * 100).toFixed(2) + '%'
        return [
          lx.translateFactSheetType(factSheetType, 'plural'),
          factSheetCount,
          averageCompletion
        ]
      })

    this.graphQLResultIndex = { ...this.graphQLResultIndex, [factSheetType]:  queryResult }
  }
}
```
We also remove from the [x-init](https://github.com/alpinejs/alpine#x-init) directive of our  <code>body</code> tag the calls to the *fetchGraphQL* method added before, since this method will be called once, per facet and upon the report initialization, and every time each facet filter changes.
```html
<!doctype  html>
<body x-data="initializeContext()" x-init="initializeReport()">
  ...
</body>
```
So now everytime a filter is applied to a facet, you can see the filtered result appearing in both Facets and GraphQL columns.
<div style="display:flex; justify-content:center">
  <img src="https://i.imgur.com/XWV4L4a.png">
</div>

## Bonus: make the report look nicer
Well, now that we have most of our report's business logic in place, it's time to improve the overall visualization aspect of it. We'll display both results, from Facets and GraphQL queries, as tables of 3 columns each: factsheet type name (pluralized), factsheet count and average completion ration. So that we can use the [css grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout) in our report, we'll have to unroll our two result index objects into an array of cell values. That is done via the *computeGridCells* method that is triggered via a couple of watches we include in the <code>body</code> [x-init](https://github.com/alpinejs/alpine#x-init) directive of our *index.html* file.

So we adapt the *index.js* file by adding the **channels** and **cellIndex** attributes to the *state*, and the **computeGridCells** method to the *methods*:
```javascript
const state = {
  factSheetTypes: ['Application', 'ITComponent', 'BusinessCapability'],
  facetResultIndex: {},
  graphqlResultIndex: {},
  channels: [
    { key:  'facet', label:  'Facets' },
    { key:  'graphql', label:  'Graphql' }
  ],
  cellIndex: {}
}
const methods = {
  async initializeReport () {
    (...)
  },
  async fetchGraphQLData (factSheetType, filter) {
    (...)
  },
  async computeGridCells (origin, index) {
    const cells = Object.entries(index)
      // Sort factsheet types alphabetically
      .sort(([ factSheetTypeA ], [ factSheetTypeB ]) =>  factSheetTypeA > factSheetTypeB ? 1 : factSheetTypeA < factSheetTypeB ? -1 : 0)
      // flatmap rows into a singe array of cells
      .reduce((accumulator, [factSheetType, row]) => { accumulator.push(...row); return  accumulator }, [])
    this.cellIndex = { ...this.cellIndex, [origin]:  cells }
  }
}
``` 
And then we adapt the *index.html* file as below:
```html
<body
  x-data="initializeContext()"
  x-init="() => {
    initializeReport()
    $watch('facetResultIndex', index => computeGridCells('facet', index))
    $watch('graphqlResultIndex', index => computeGridCells('graphql', index))
  }">
  <div class="container mx-auto text-md text-gray-800">
    <div class="flex flex-wrap items-start justify-center mt-16 -mx-8 pt-16">
      <template x-for="channel of channels">
        <div class="flex flex-col items-center justify-center px-8">
          <span class="text-3xl font-bold uppercase py-4" x-text="channel.label"></span>
          <div class="grid grid-cols-3 text-center border-r border-b">
            <span  class="p-2 font-bold uppercase border-l border-t bg-gray-200">FactSheet Type</span>
            <span class="p-2 font-bold uppercase border-l border-t bg-gray-200">Count</span>
            <span class="p-2 font-bold uppercase border-l border-t bg-gray-200">Completion</span>
            <template x-for="cell of cellIndex[channel.key] || []">
              <span class="p-2 border-l border-t" x-text="cell"></span>
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
</body>
```

Launching now our report with the <code>npm start</code> command results in this much nicer version.
<div style="display:flex; justify-content:center">
  <img src="https://i.imgur.com/Ce3e7jF.png">
</div>

Congratulations, you have finalized this report!