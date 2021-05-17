import { useEffect, useState } from 'preact/hooks'
import { fetchDepartmentGraph } from '../../store/slices/DepartmentGraphSlice'
import { useSelector, useDispatch } from 'react-redux'
import { Chord } from '@nivo/chord'
import style from './style.css'
import { LOADING_STATUS } from '../../store/slices/globals'
import { useDatasets } from '../../util'
import AnimateHeight from 'react-animate-height'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { CSSTransition } from 'react-transition-group'
import { colors } from '../../style/colors'

function Departments () {
  const datasets = useDatasets()
  const graphData = useSelector(state => state.departmentsGraph.data)
  const graphDataStatus = useSelector(state => state.departmentsGraph.status)
  const [showInfo, setShowInfo] = useState(true)
  const dispatch = useDispatch()

  useEffect(() => {
    if (graphDataStatus === LOADING_STATUS.idle) {
      dispatch(fetchDepartmentGraph())
    }
  }, [dispatch, graphDataStatus])

  useEffect(() => {
    if (!graphData.nodes || datasets.nodes.length > 0) return
    // Update datasets using shallow copies of the data as vis-network mutates
    // some of the nodes/edges state internally
    datasets.nodes.update(graphData.nodes.map((n, i) => {
      return {
        ...n,
        color: getColor(i)
      }
    }))
    datasets.edges.update(graphData.links.map(e => Object.assign({}, e)))
  }, [graphData, datasets.nodes, datasets.edges])

  function getColor (i) {
    return colors.palette[i % colors.palette.length]
  }

  return (
    <div class={style.wrapper}>

      <header class={style.header}>
        <h2>
          Department Network
        </h2>
        <button
          onClick={() => setShowInfo(!showInfo)}
        >{showInfo ? 'Hide' : 'Show'} description
        </button>
      </header>
      <AnimateHeight height={showInfo ? 'auto' : 0}>
        <div className={style.description}>
          <p>
            This chord diagram shows what percentage of users that comment in one department, also
            comment in any of the other departments. Each segment of the ring represents a department, e.g. "Politik".
            The width of the ribbons connecting the departments indicates the percentage of users that
            comment in one and the other department. Hovering over the ribbons shows the exact percentages.
          </p>
          <p>
            For example, hovering over the ribbon connecting "Politik" and "Sport" reveals that around 11 % of the users
            commenting in "Sport" make up around 6 % of the users that comment in "Politik".
          </p>
          <p>
            There are ribbons that only belong to one department. These represent the share of users that only comment
            in one department, but not in any of the others. For example around 21 % of users only comment in "Politik".
          </p>
        </div>
      </AnimateHeight>

      <CSSTransition
        in={graphDataStatus !== LOADING_STATUS.succeeded}
        mountOnEnter
        unmountOnExit
        timeout={300}
        classNames='fade'
      >
        <div class={style.loadingBox}>
          <FontAwesomeIcon icon={faSpinner} spin /> Loading...
        </div>
      </CSSTransition>

      {graphData.nodes &&
        <Chord
          width={800}
          height={600}
          matrix={graphData.matrix}
          keys={graphData.nodes.map(n => n.id)}
          margin={{ top: 60, right: 160, bottom: 30, left: 60 }}
          valueFormat={num => {
            const float = parseFloat(num) * 100
            return `${float.toFixed(2)} %`
          }}
          padAngle={0.02}
          innerRadiusRatio={0.96}
          innerRadiusOffset={0.02}
          arcOpacity={1}
          arcBorderWidth={1}
          arcBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
          ribbonOpacity={0.5}
          ribbonBorderWidth={1}
          ribbonBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
          enableLabel
          label='id'
          labelOffset={12}
          // labelRotation={-90}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1]] }}
          colors={colors.palette}
          isInteractive
          arcHoverOpacity={1}
          arcHoverOthersOpacity={0.2}
          ribbonHoverOpacity={1}
          ribbonHoverOthersOpacity={0.2}
          animate
          legends={[
            {
              anchor: 'right',
              direction: 'column',
              justify: false,
              translateX: 140,
              translateY: 0,
              itemWidth: 80,
              itemHeight: 14,
              itemsSpacing: 4,
              itemTextColor: '#999',
              itemDirection: 'left-to-right',
              symbolSize: 12,
              symbolShape: 'circle',
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemTextColor: '#000'
                  }
                }
              ]
            }
          ]}
        />}
    </div>
  )
}

export default Departments
