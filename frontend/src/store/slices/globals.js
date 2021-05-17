export const LOADING_STATUS = Object.freeze({
  idle: 'idle',
  loading: 'loading',
  succeeded: 'succeeded',
  failed: 'failed'
})

export const OPERATORS = Object.freeze({
  equal: '=',
  greaterOrEqual: '≥',
  lessOrEqual: '≤'
})

export const RECIPROCITY_SETTINGS = Object.freeze({
  all: {
    key: 'all',
    name: 'All edges'
  },
  reciprocal: {
    key: 'only',
    name: 'Reciprocal edges only'
  },
  nonReciprocal: {
    key: 'none',
    name: 'Non-Reciprocal edges only'
  }
})

export const COMMUNITY_VALUES = Object.freeze({
  cliques: {
    key: 'cliques',
    name: 'Cliques'
  },
  labelPropagation: {
    key: 'labelPropagation',
    name: 'Label Propagation'
  },
  modularity: {
    key: 'modularity',
    name: 'Maximum Modularity'
  }
})

export const CENTRALITY_VALUES = Object.freeze({
  degree: {
    key: 'degree',
    name: 'Degree Centrality'
  },
  inDegree: {
    key: 'in-degree',
    name: 'In-Degree Centrality'
  },
  outDegree: {
    key: 'out-degree',
    name: 'Out-Degree Centrality'
  },
  betweenness: {
    key: 'betweenness',
    name: 'Betweenness Centrality'
  },
  closeness: {
    key: 'closeness',
    name: 'Closeness Centrality'
  },
  eigenvector: {
    key: 'eigenvector',
    name: 'Eigenvector Centrality'
  },
  harmonic: {
    key: 'harmonic',
    name: 'Harmonic Centrality'
  },
  pagerank: {
    key: 'pagerank',
    name: 'PageRank'
  }
})
