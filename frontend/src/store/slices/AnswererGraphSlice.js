import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { CENTRALITY_VALUES, COMMUNITY_VALUES, LOADING_STATUS, OPERATORS, RECIPROCITY_SETTINGS } from './globals'
import API from '../../api'

export const fetchAnswererGraph = createAsyncThunk(
  'answererGraph/getGraph',
  async (graphSettings, { getState }) => {
    let settings = graphSettings
    if (settings === undefined) {
      settings = getState().answererGraph.settings
    }
    return await API.getAnswererGraph(settings)
  }
)

export const answererGraphSlice = createSlice({
  name: 'answererGraph',
  initialState: {
    status: LOADING_STATUS.idle,
    error: null,
    data: null,
    selectedNodes: null,
    simulationPaused: true,
    triggerFit: 0,
    finishedDrawing: false,
    stabilized: false,
    filteredStats: {
      visibleNodes: 0,
      visibleEdges: 0,
      avgEdgeWeight: 0,
      reciprocity: 0
    },
    settings: {
      answerThreshold: 40,
      selfloops: false,
      largestSubgraphOnly: false
    },
    filters: {
      centrality: {
        active: false,
        value: CENTRALITY_VALUES.degree.key
      },
      community: {
        active: false,
        value: COMMUNITY_VALUES.cliques.key,
        size: [OPERATORS.equal, 3],
        cliques: {
          min: 2,
          max: 10
        },
        labelPropagation: {
          min: 2,
          max: 10
        },
        modularity: {
          min: 2,
          max: 10
        }
      },
      nodeFilters: {
        active: false,
        edgeWeightRange: [0, 2000],
        hideNonReciprocal: false,
        reciprocal: RECIPROCITY_SETTINGS.all.key,
        reciprocalWeightRatioRange: [0.0, 7.0]
      }
    },
    detailView: {
      x: 0,
      y: 36,
      height: 300,
      width: 300,
      visible: false,
      data: null
    }
  },
  reducers: {
    setSelectedNodes (state, action) {
      state.selectedNodes = action.payload
    },
    pauseSimulation (state, action) {
      state.simulationPaused = action.payload
    },
    updateFilterValue (state, action) {
      const { filter, value } = action.payload
      state.filters[filter].value = value
    },
    updateFilterProperty (state, action) {
      const { filter, property, value } = action.payload
      state.filters[filter][property] = value
    },
    updateFilterGroupValue (state, action) {
      const { filter, group, value } = action.payload
      state.filters[filter][group].value = value
    },
    setFilterActive (state, action) {
      const { filter, active } = action.payload
      state.filters[filter].active = active
    },
    updateSettings (state, action) {
      state.settings = action.payload
    },
    setFinishedDrawing (state, action) {
      state.finishedDrawing = action.payload
    },
    setStabilized (state, action) {
      state.stabilized = action.payload
    },
    triggerFit (state) {
      state.triggerFit += 1
    },
    updateDetailView (state, action) {
      state.detailView = {
        ...state.detailView,
        ...action.payload
      }
    },
    setVisibleNodeStats (state, action) {
      state.filteredStats = action.payload
    },
    setDetailViewToEgoGraph (state, action) {
      const egoNode = action.payload
      const links = state.data.links.filter(link => {
        return (
          link.to === egoNode.id ||
          link.from === egoNode.id
        )
      })
      const nodeIds = new Set(links.flatMap(e => [e.to, e.from]))
      const nodes = state.data.nodes.filter(n => nodeIds.has(n.id))
      state.detailView.data = {
        nodes,
        links
      }
    }
  },
  extraReducers: {
    [fetchAnswererGraph.pending]: (state) => {
      state.finishedDrawing = false
      state.status = LOADING_STATUS.loading
    },
    [fetchAnswererGraph.fulfilled]: (state, action) => {
      state.status = LOADING_STATUS.succeeded
      state.data = action.payload

      const cliqueSizes = action.payload.community.cliques.map(arr => arr.length)
      state.filters.community.cliques.max = Math.max(...cliqueSizes)
      state.filters.community.cliques.min = Math.min(...cliqueSizes)

      const labelPropSizes = action.payload.community.labelPropagation.map(arr => arr.length)
      state.filters.community.labelPropagation.max = Math.max(...labelPropSizes)
      state.filters.community.labelPropagation.min = Math.min(...labelPropSizes)

      const modularitySizes = action.payload.community.modularity.map(arr => arr.length)
      state.filters.community.modularity.max = Math.max(...modularitySizes)
      state.filters.community.modularity.min = Math.min(...modularitySizes)

      state.filters.nodeFilters.edgeWeightRange = [
        action.payload.stats.min_weight,
        action.payload.stats.max_weight
      ]
      state.filters.nodeFilters.reciprocalWeightRatioRange = [
        action.payload.stats.min_reciprocal_ratio,
        action.payload.stats.max_reciprocal_ratio
      ]

      state.filteredStats.visibleNodes = action.payload.stats.node_count
      state.filteredStats.visibleEdges = action.payload.stats.edge_count
      state.filteredStats.avgEdgeWeight = action.payload.stats.avg_weight
      state.filteredStats.reciprocity = action.payload.stats.reciprocity
    },
    [fetchAnswererGraph.rejected]: (state, action) => {
      state.status = LOADING_STATUS.failed
      state.error = action.error.message
    }
  }
})

// Extract the action creators object and the reducer
const { actions, reducer } = answererGraphSlice

// Extract and export each action creator by name
export const {
  setSelectedNodes,
  pauseSimulation,
  updateFilters,
  updateSettings,
  setFilterActive,
  updateFilterValue,
  updateFilterProperty,
  updateFilterGroupValue,
  setFinishedDrawing,
  setStabilized,
  updateDetailView,
  setDetailViewToEgoGraph,
  setVisibleNodeStats,
  triggerFit
} = actions

// Export the reducer, either as a default or named export
export default reducer
