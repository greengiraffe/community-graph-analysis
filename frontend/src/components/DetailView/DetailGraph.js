import { useEffect, useState } from 'preact/hooks'
import VisNetwork from '../VisNetwork'
import { useDispatch, useSelector } from 'react-redux'
import { useDatasets } from '../../util'
import { setSelectedNodes } from '../../store/slices/AnswererGraphSlice'

/** @type import('vis-network/peer').Options */
const detailGraphConfig = {
  interaction: {
    hover: true,
    multiselect: false,
    hideEdgesOnDrag: false
  },
  edges: {
    arrowStrikethrough: false,
    arrows: 'to',
    smooth: {
      enabled: true,
      type: 'continuous'
    },
    color: {
      inherit: 'from',
      opacity: 0.75
    }
  },
  physics: {
    minVelocity: 0.5,
    maxVelocity: 100,
    solver: 'forceAtlas2Based',
    adaptiveTimestep: true,
    forceAtlas2Based: {
      // gravitationalConstant: -5000,
      avoidOverlap: 0.75
    },
    stabilization: {
      enabled: true,
      iterations: 1000,
      updateInterval: 50,
      fit: true
    }
  }
}

function DetailGraph ({ className, data }) {
  const dispatch = useDispatch()
  const datasets = useDatasets()
  const selectedNodes = useSelector(state => state.answererGraph.selectedNodes)
  const [pauseSim, setPauseSim] = useState(false)

  // Update answerer graph data
  useEffect(() => {
    if (!data.nodes) return
    // Update datasets using shallow copies of the data as vis-network mutates
    // some of the nodes/edges state internally
    setPauseSim(false)
    datasets.nodes.clear()
    datasets.edges.clear()
    datasets.nodes.add(data.nodes.map(n => Object.assign({}, n)))
    datasets.edges.add(data.links.map(e => {
      return {
        ...e,
        hidden: false,
        title: `${e.value} answers`
      }
    }))
  }, [data, datasets.edges, datasets.nodes])

  function selectNode (args) {
    const selectedNodes = datasets.nodes.get(args.nodes)
    dispatch(setSelectedNodes(selectedNodes))
  }

  function deselectNode () {
    dispatch(setSelectedNodes())
  }

  const events = {
    selectNode,
    deselectNode,
    dragStart () {
      setPauseSim(true)
    }
  }

  return data && (
    <VisNetwork
      datasets={datasets}
      options={detailGraphConfig}
      events={events}
      pauseSimulation={pauseSim}
      className={className}
      selectedNodes={selectedNodes}
    />
  )
}

export default DetailGraph
