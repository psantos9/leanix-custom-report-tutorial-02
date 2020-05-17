import 'alpinejs'
import '@leanix/reporting'
import './assets/tailwind.css'

const state = {
  channels: [
    { key: 'facet', label: 'Facets' },
    { key: 'graphql', label: 'Graphql' }
  ],
  factSheetTypes: ['Application', 'ITComponent', 'BusinessCapability'],
  facetResultIndex: {},
  graphqlResultIndex: {},
  cellIndex: {}
}

const methods = {
  async initializeReport () {
    const setup = await lx.init()
    this.baseUrl = setup.settings.baseUrl
    const facets = this.factSheetTypes
      .map((factSheetType, key) => ({
        key,
        fixedFactSheetType: factSheetType,
        attributes: ['completion{completion}'],
        callback: factSheets => {
          const factSheetCount = factSheets.length
          const averageCompletion = ((factSheets
            .reduce((accumulator, { completion }) => accumulator += completion.completion, 0) / factSheetCount) * 100).toFixed(2) + '%'
          const facetResult = [
            lx.translateFactSheetType(factSheetType, 'plural'),
            factSheetCount,
            averageCompletion
          ]
          this.facetResultIndex = { ...this.facetResultIndex, [factSheetType]: facetResult }
        },
        facetFiltersChangedCallback: filter => this.fetchGraphQLData(factSheetType, filter)
      }))
    const config = { facets }
    return lx.ready(config)
  },
  async fetchGraphQLData (factSheetType, filter) {
    // Destructing assignment of filter object with alias for facets and fullTextSearch attributes
    const { facets: facetFilters, fullTextSearchTerm: fullTextSearch, directHits } = filter

    const mappedFilter = { facetFilters, fullTextSearch, ids: directHits.map(({ id }) => id) }

    const query = 'query($filter:FilterInput){allFactSheets(filter:$filter){edges{node{completion{completion}}}}}'
    const queryResult = await lx.executeGraphQL(query, { filter: mappedFilter })
    .then(({ allFactSheets }) => {
      const factSheets = allFactSheets.edges.map(({ node }) => node)
      const factSheetCount = factSheets.length
      const averageCompletion = ((factSheets
        .reduce((accumulator, { completion }) => accumulator += completion.completion, 0) / factSheetCount) * 100).toFixed(2) + '%'
      return [
        lx.translateFactSheetType(factSheetType, 'plural'),
        factSheetCount,
        averageCompletion
      ]
    })
    this.graphqlResultIndex = { ...this.graphqlResultIndex, [factSheetType]: queryResult }
  },
  computeGridCells (origin, index) {
    const cells = Object.entries(index)
      // Sort factsheet types alphabetically
      .sort(([ factSheetTypeA ], [ factSheetTypeB ]) => factSheetTypeA > factSheetTypeB ? 1 : factSheetTypeA < factSheetTypeB ? -1 : 0)
      // flatmap rows into a singe array of cells
      .reduce((accumulator, [factSheetType, row]) => { accumulator.push(...row); return accumulator }, [])
    this.cellIndex = { ...this.cellIndex, [origin]: cells }
  }
}

window.initializeContext = () => {
  return {
    ...state,
    ...methods
  }
}
