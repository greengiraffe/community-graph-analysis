import { useEffect, useRef, useState } from 'preact/hooks'
import {
  setSelectedNodes,
  setStabilized,
  setFinishedDrawing,
  updateDetailView,
  setVisibleNodeStats
} from '../../store/slices/AnswererGraphSlice'
import { useDispatch, useSelector } from 'react-redux'
import { CSSTransition } from 'react-transition-group'
import VisNetwork from '../VisNetwork'
import { LOADING_STATUS, OPERATORS, RECIPROCITY_SETTINGS } from '../../store/slices/globals'
import { useDatasets } from '../../util'
import { colors } from '../../style/colors'
import style from './style.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'

/** @type import('vis-network/peer').Options */
const graphOptions = {
  // physics: false,
  edges: {
    color: {
      inherit: false
    },
    arrows: 'to',
    // arrowStrikethrough: false,
    smooth: {
      enabled: true,
      type: 'continuous'
    }
  },
  layout: {
    improvedLayout: false
  }
}

const preRenderIterations = 100

function filterActiveEqual (prev, next) {
  return (
    prev.active === false && prev.active === next.active
  )
}

function AnswererGraph ({ className, data, onRetryLoading }) {
  const dispatch = useDispatch()
  const fetchStatus = useSelector(state => state.answererGraph.status)
  const finishedDrawing = useSelector(state => state.answererGraph.finishedDrawing)
  const simulationPaused = useSelector(state => state.answererGraph.simulationPaused)
  const selectedNodes = useSelector(state => state.answererGraph.selectedNodes)
  const datasets = useDatasets({ queue: true })
  const triggerFit = useSelector(state => state.answererGraph.triggerFit)
  const [stabilizationProgress, setStabilizationProgress] = useState(0)
  const nodeFilters = useSelector(state => state.answererGraph.filters.nodeFilters, filterActiveEqual)
  const communityFilters = useSelector(state => state.answererGraph.filters.community, filterActiveEqual)
  const centralityFilters = useSelector(state => state.answererGraph.filters.centrality, filterActiveEqual)
  const visNetworkRef = useRef(null)

  useEffect(() => {
    return () => {
      dispatch(setFinishedDrawing(false))
    }
  }, [dispatch])

  // Update answerer graph data
  useEffect(() => {
    if (!data) return

    // Update datasets using shallow copies of the data as vis-network mutates
    // some of the nodes/edges state internally

    datasets.nodes.clear()
    datasets.edges.clear()
    datasets.nodes.update(data.nodes.map(n => Object.assign({}, n)))
    datasets.edges.update(data.links.map(e => Object.assign({}, e)))
    datasets.nodes.flush()
    datasets.edges.flush()
  }, [data, datasets.nodes, datasets.edges])

  useEffect(() => {
    console.info('node filters active', nodeFilters.active)
    if (nodeFilters.active) {
      applyNodeFilters()
    } else {
      resetNodeFilters()
    }
  }, [nodeFilters]) // eslint-disable-line

  useEffect(() => {
    console.info('community filter active', communityFilters.active, communityFilters.value)
    if (communityFilters.active) {
      highlightCommunities(communityFilters.value)
    } else {
      resetCommunityHighlighting()
    }
  }, [communityFilters]) // eslint-disable-line

  useEffect(() => {
    console.info('centrality filter active', centralityFilters.active)
    if (centralityFilters.active) {
      highlightCentrality()
    } else {
      resetCentralityHighlighting()
    }
  }, [centralityFilters]) // eslint-disable-line

  useEffect(() => {
    if (visNetworkRef.current.visNetworkInstance !== null) {
      visNetworkRef.current.visNetworkInstance.fit()
    }
  }, [triggerFit])

  function applyNodeFilters () {
    const { nodes, edges } = getDatasetsAsObjects()

    const filteredNodeSet = new Set()
    let visibleEdgeCounter = 0
    let visibleEdgesWeightSum = 0
    let visibleEdgesReciprocalCounter = 0
    const [minWeight, maxWeight] = nodeFilters.edgeWeightRange
    const [minReciRatio, maxReciRatio] = nodeFilters.reciprocalWeightRatioRange
    const reciprocal = nodeFilters.reciprocal

    const inReciRatioRange = (reciRatio) => {
      return (reciRatio >= minReciRatio && reciRatio <= maxReciRatio)
    }

    const inWeightRange = (weight) => {
      return (weight >= minWeight && weight <= maxWeight)
    }

    for (const edgeId in edges) {
      edges[edgeId].hidden = true
      edges[edgeId].physics = false

      // filter by edge weight range
      if (inWeightRange(edges[edgeId].value)) {
        edges[edgeId].hidden = false
        edges[edgeId].physics = true

        if (reciprocal === RECIPROCITY_SETTINGS.reciprocal.key) {
          // Hide non-reciprocal edges
          if (!edges[edgeId].reciprocal) {
            edges[edgeId].hidden = true
            edges[edgeId].physics = false
          }

          // Highlight reciprocal edges in the ratio range
          if (edges[edgeId].reciprocal &&
          inReciRatioRange(edges[edgeId].reciprocal_weight_ratio)
          ) {
            edges[edgeId].hidden = false
            edges[edgeId].physics = true
            edges[edgeId].arrows = 'to'
            edges[edgeId].title = edges[edgeId].reciprocal_weight_ratio
          } else {
            edges[edgeId].hidden = true
            edges[edgeId].physics = false
          }
        }
        if (reciprocal === RECIPROCITY_SETTINGS.nonReciprocal.key) {
          // Hide reciprocal edges
          if (edges[edgeId].reciprocal) {
            edges[edgeId].hidden = true
            edges[edgeId].physics = false
          }
        }
      }

      // Keep track of the nodes that are connected to visible edges
      if (!edges[edgeId].hidden) {
        visibleEdgeCounter += 1
        visibleEdgesWeightSum += edges[edgeId].value
        if (edges[edgeId].reciprocal) {
          visibleEdgesReciprocalCounter += 1
        }
        // adding as strings because nodeIds of the nodes object
        // are strings as well, and we can run filteredNodeSet.has(nodeId)
        filteredNodeSet.add(String(edges[edgeId].to))
        filteredNodeSet.add(String(edges[edgeId].from))
      }
    }

    const reciprocityPercent = (visibleEdgesReciprocalCounter / visibleEdgeCounter) * 100
    dispatch(setVisibleNodeStats({
      visibleNodes: filteredNodeSet.size,
      visibleEdges: visibleEdgeCounter,
      avgEdgeWeight: (visibleEdgesWeightSum / visibleEdgeCounter).toFixed(2),
      reciprocity: reciprocityPercent.toFixed(2)
    }))

    for (const nodeId in nodes) {
      nodes[nodeId].hidden = true
      nodes[nodeId].physics = false
      if (filteredNodeSet.has(nodeId)) {
        nodes[nodeId].hidden = false
        nodes[nodeId].physics = true
      }
    }

    updateLiveDatasets(nodes, edges)
  }

  function resetNodeFilters () {
    const { nodes, edges } = getDatasetsAsObjects()

    for (const edgeId in edges) {
      edges[edgeId].hidden = null
      edges[edgeId].physics = null
      edges[edgeId].title = null
    }

    for (const nodeId in nodes) {
      nodes[nodeId].hidden = false
      nodes[nodeId].physics = null
    }
    updateLiveDatasets(nodes, edges)
  }

  function highlightCommunities (communityMetric) {
    const [op, size] = communityFilters.size
    const communities = data.community[communityMetric]
      .filter(community => {
        switch (op) {
          case OPERATORS.equal:
            return community.length === size
          case OPERATORS.greaterOrEqual:
            return community.length >= size
          case OPERATORS.lessOrEqual:
            return community.length <= size
        }
        return false
      })
      .sort((a, b) => a.length - b.length)

    const { nodes, edges } = getDatasetsAsObjects()

    // Make all nodes grey and hide their labels
    for (const nodeId in nodes) {
      nodes[nodeId].color = colors.fadedNode
    }

    // Highlight community nodes and show their labels
    communities.forEach((community, i) => {
      community.forEach(nodeId => {
        nodes[nodeId].color = null
        nodes[nodeId].group = i
      })
    })

    // Color edges belonging to the community
    const containsEdge = (community, edge) => {
      return [edge.from, edge.to].every(id => community.includes(id))
    }

    for (const edgeId in edges) {
      edges[edgeId].color = colors.fadedNode
      if (communities.some(community => containsEdge(community, edges[edgeId]))) {
        edges[edgeId].color = {
          inherit: 'from'
        }
      }
    }

    updateLiveDatasets(nodes, edges)
  }

  function resetCommunityHighlighting () {
    const { nodes, edges } = getDatasetsAsObjects()

    for (const nodeId in nodes) {
      nodes[nodeId].color = null
      nodes[nodeId].group = undefined
    }

    for (const edgeId in edges) {
      edges[edgeId].color = null
    }

    updateLiveDatasets(nodes, edges)
  }

  function highlightCentrality () {
    const { nodes } = getDatasetsAsObjects()

    // Set node sizes according to centrality
    const centrality = data.centrality[centralityFilters.value]
    function minmax (value, outMin, outMax) {
      return outMin + ((value - centrality.min) * (outMax - outMin)) / (centrality.max - centrality.min)
    }
    for (const nodeId in centrality.values) {
      nodes[nodeId].size = minmax(centrality.values[nodeId], 10, 100)
    }

    updateLiveDatasets(nodes)
  }

  function resetCentralityHighlighting () {
    const { nodes } = getDatasetsAsObjects()

    // reset all nodes sizes
    for (const nodeId in nodes) {
      nodes[nodeId].size = null
    }

    updateLiveDatasets(nodes)
  }

  function resetAllFilters (nodes, edges) {
    if (nodes) {
      for (const nodeId in nodes) {
        nodes[nodeId].size = null // from centrality filter
        nodes[nodeId].color = null // from community filter
        nodes[nodeId].hidden = false // from nodeFilters
        if (nodes[nodeId].hiddenLabel) {
          // from community filter
          nodes[nodeId].label = nodes[nodeId].hiddenLabel
          nodes[nodeId].hiddenLabel = null
        }
      }
    }

    if (edges) {
      for (const edgeId in edges) {
        edges[edgeId].color = null // from community filter
        edges[edgeId].hidden = false // from nodeFilters
      }
    }
  }

  function getDatasetsAsObjects () {
    return {
      nodes: datasets.nodes.get({ returnType: 'Object' }),
      edges: datasets.edges.get({ returnType: 'Object' })
    }
  }

  function updateLiveDatasets (nodes, edges) {
    // transform the object into an array
    if (nodes) {
      const updatedNodes = []
      for (const nodeId in nodes) {
        const node = nodes[nodeId]
        // Delete position properties to prevent
        // redrawing at the wrong position (positions
        // may have changed if the simulation is running)
        delete node.x
        delete node.y
        updatedNodes.push(nodes[nodeId])
      }
      datasets.nodes.update(updatedNodes)
      datasets.nodes.flush()
    }

    if (edges) {
      const updatedEdges = []
      for (const edgeId in edges) {
        updatedEdges.push(edges[edgeId])
      }

      datasets.edges.update(updatedEdges)
      datasets.edges.flush()
    }
  }

  const answererGraphEvents = {
    selectNode,
    deselectNode,
    startStabilizing () {
      dispatch(setStabilized(false))
    },
    stabilized () {
      dispatch(setStabilized(true))
    },
    stabilizationProgress (args) {
      setStabilizationProgress(args.iterations)
    }
  }

  function selectNode (args) {
    let nodes, links

    if (args.nodes.length === 1) {
      // 1 node selected: take current node plus its neighbours

      // Copy nodes and edges from existing dataset
      links = datasets.edges.get(args.edges).map((e) => Object.assign({}, e))
      const nodeSet = new Set()
      links.forEach(link => {
        nodeSet.add(link.from)
        nodeSet.add(link.to)
      })
      const nodeIds = Array.from(nodeSet)
      nodes = datasets.nodes.get(nodeIds).map((n) => Object.assign({}, n))
    } else {
      // >1 node selected: only take selected nodes
      nodes = datasets.nodes.get(args.nodes).map((n) => Object.assign({}, n))
      links = datasets.edges.get(args.edges).map((e) => Object.assign({}, e))
    }

    // Remove highlighting & filters that the copied data may have inherited
    resetAllFilters(nodes, links)

    // Reset node positions
    nodes = nodes.map(n => {
      return {
        id: n.id,
        label: n.label
      }
    })

    nodes
      .filter(n => args.nodes.includes(n.id))
      .forEach(n => { n.group = 'detailView' })

    const selectedNodes = datasets.nodes.get(args.nodes).map((n) => Object.assign({}, n))
    dispatch(setSelectedNodes(selectedNodes))

    // Show details graph for the selected nodes and their links
    dispatch(updateDetailView({
      data: {
        nodes,
        links
      }
    }))
  }

  function deselectNode () {
    dispatch(setSelectedNodes(null))
  }

  function loadingState () {
    switch (fetchStatus) {
      case LOADING_STATUS.loading:
        return <p><FontAwesomeIcon icon={faSpinner} fixedWidth spin /> Loading...</p>
      case LOADING_STATUS.failed:
        return (
          <>
            <p class={style.error}>Error fetching the graph data</p>
            <button
              onClick={() => onRetryLoading()}
              class={style.retryButton}
            >
              Retry
            </button>
          </>
        )
      default:
        if (!finishedDrawing) {
          return <p><FontAwesomeIcon icon={faSpinner} fixedWidth spin /> Preparing graph {stabilizationProgress}/{preRenderIterations}...</p>
        }
    }
  }

  return (
    <>
      <CSSTransition
        in={!finishedDrawing}
        mountOnEnter
        unmountOnExit
        timeout={200}
        classNames='fade'
      >
        <div class={style.loadingScreen}>
          {loadingState()}
        </div>
      </CSSTransition>
      <VisNetwork
        ref={visNetworkRef}
        datasets={datasets}
        events={answererGraphEvents}
        options={graphOptions}
        pauseSimulation={simulationPaused}
        className={className}
        preRenderIterations={100}
        afterFirstDraw={() => {
          visNetworkRef.current.visNetworkInstance.fit()
          dispatch(setFinishedDrawing(true))
        }}
        selectedNodes={selectedNodes}
      />
    </>
  )
}

export default AnswererGraph
