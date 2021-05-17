import { useEffect, useImperativeHandle, useRef } from 'preact/hooks'
import { forwardRef } from 'preact/compat'
import { Network } from 'vis-network'
import { colors } from '../../style/colors'
import style from './style.css'

/** @type import('vis-network/peer').Options */
const defaultOpts = {
  // DEFAULT OPTIONS
  height: '100%',
  width: '100%',
  autoResize: true,
  nodes: {
    shape: 'dot',
    color: {
      ...colors.defaultNode,
      highlight: {
        ...colors.highlightNode
      },
      hover: {
        ...colors.hoverNode
      }
    }
  },
  groups: {
    useDefaultGroups: true
  },
  edges: {
    width: 0.15,
    smooth: {
      enabled: true,
      type: 'dynamic'
    },
    color: {
      inherit: 'from'
    }
  },
  interaction: {
    tooltipDelay: 200,
    hideEdgesOnDrag: true
  },
  layout: {
    improvedLayout: true,
    randomSeed: 42
  },
  physics: {
    enabled: true,
    solver: 'forceAtlas2Based',
    maxVelocity: 500,
    minVelocity: 30,
    forceAtlas2Based: {
      theta: 0.5,
      gravitationalConstant: -80,
      centralGravity: 0.01,
      springConstant: 0.2,
      springLength: 100,
      damping: 0.2,
      avoidOverlap: 0.1
    },
    stabilization: {
      enabled: true,
      iterations: 10,
      updateInterval: 5,
      onlyDynamicEdges: false,
      fit: false
    },
    timestep: 0.1,
    adaptiveTimestep: true
  }
}

function VisNetwork ({
  datasets,
  options = {},
  events = {},
  eventsOnce = {},
  afterFirstDraw = () => {}, // triggered after data has changed
  pauseSimulation = false,
  preRenderIterations = 100,
  fitWhenStabilized = false,
  selectedNodes,
  className
}, ref) {
  const container = useRef(null)
  const networkRef = useRef(null)
  const needsNodePosUpdate = useRef(pauseSimulation)

  useImperativeHandle(ref, () => ({
    visNetworkInstance: networkRef.current
  }))

  useEffect(() => {
    // const opts = { ...defaultOpts, ...options }
    networkRef.current = new Network(container.current, datasets, defaultOpts)
    networkRef.current.setOptions(options)

    datasets.nodes.on('add', () => {
      console.info('Added new nodes')
      networkRef.current.once('afterDrawing', () => {
        afterFirstDraw()
      })
      networkRef.current.stabilize(preRenderIterations)
    })

    console.info('Vis Network created')

    // Add callbacks passed via props to network
    // attaching the network as a 2nd argument to the callback
    Object.entries(events).forEach(([evt, callback]) => {
      networkRef.current.on(evt, (args) => callback(args))
    })
    Object.entries(eventsOnce).forEach(([evt, callback]) => {
      networkRef.current.once(evt, (args) => callback(args))
    })

    // Always save node positions in DataSet after drag
    networkRef.current.on('dragEnd', () => {
      networkRef.current.storePositions()
    })

    networkRef.current.on('stabilized', () => {
      console.info('stabilized')
      if (needsNodePosUpdate.current) {
        networkRef.current.storePositions()
        needsNodePosUpdate.current = false
      }
      if (fitWhenStabilized) {
        networkRef.current.fit({ animation: { duration: 250 } })
      }
    })

    return () => {
      // Cleanup: very important to mitigate memory leaks
      networkRef.current.destroy()
      networkRef.current = null
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!networkRef.current) return
    if (pauseSimulation) {
      needsNodePosUpdate.current = true
      networkRef.current.stopSimulation()
      // settings physics to false prevents restarting
      // the physics simulation when dragging nodes
      // NOTE: the stopSimulation and setOptions call both
      // trigger a stabilized event
      networkRef.current.setOptions({ physics: false })
    } else {
      networkRef.current.setOptions({ physics: true })
      networkRef.current.startSimulation()
    }
  }, [pauseSimulation])

  useEffect(() => {
    if (!networkRef.current) return
    networkRef.current.setOptions(options)
  }, [options])

  useEffect(() => {
    if (!networkRef.current || !selectedNodes) return
    highlightNodes(selectedNodes.map(n => n.id))
  }, [selectedNodes])

  function highlightNodes (nodes) {
    try {
      networkRef.current.selectNodes(nodes)
    } catch (e) {
      console.warn('Could not highlight nodes', nodes)
    }
  }

  return (
    <div ref={container} class={className || style.container} />
  )
}

export default forwardRef(VisNetwork)
