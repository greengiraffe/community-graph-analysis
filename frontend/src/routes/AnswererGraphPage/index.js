import { useEffect, useState } from 'preact/hooks'
import Sidebar from '../../components/Sidebar'
import style from './style.css'
import AnswererGraph from '../../components/AnswererGraph'
import { useDispatch, useSelector } from 'react-redux'
import UserStats from '../../components/UserStats'
import DetailView from '../../components/DetailView'
import { LOADING_STATUS } from '../../store/slices/globals'
import { fetchAnswererGraph, setSelectedNodes, setDetailViewToEgoGraph } from '../../store/slices/AnswererGraphSlice'
import { fetchUserData } from '../../store/slices/UserDataSlice'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faWindowClose, faWindowMaximize } from '@fortawesome/free-solid-svg-icons'
import NodeSearch from '../../components/NodeSearch'

function Home () {
  const dispatch = useDispatch()
  const selectedNodes = useSelector(state => state.answererGraph.selectedNodes)
  const graphData = useSelector(state => state.answererGraph.data)
  const graphDataStatus = useSelector(state => state.answererGraph.status)
  const userData = useSelector(state => state.userData.data)
  const detailViewData = useSelector(state => state.answererGraph.detailView.data)
  const [showDetailGraph, setShowDetailGraph] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    if (graphDataStatus === LOADING_STATUS.idle) {
      dispatch(fetchAnswererGraph())
    }
  }, [dispatch, graphDataStatus])

  useEffect(() => {
    if (!selectedNodes) return
    if (selectedNodes.length === 1) {
      dispatch(fetchUserData(selectedNodes[0].id))
    }
  }, [dispatch, selectedNodes])

  function onDetailViewClose () {
    setShowDetailGraph(false)
  }

  const description = `
    Each node represents a highly active user.
    There is a link between two users, if one user
    has commented on a post of the other user.
    The edge weight is equal to the number of times
    a user has answered a post of the other user.
  `

  return (
    <div class={style.pageWrapper}>
      <Sidebar
        description={description}
      />
      <div class={style.graphContainer}>
        <button
          className={`
            ${style.floatingButton}
            ${style.detailViewButton}
            ${detailViewData && style.hasData}
          `}
          onClick={() => setShowDetailGraph(!showDetailGraph)}
        >
          <FontAwesomeIcon
            icon={showDetailGraph ? faWindowClose : faWindowMaximize}
          />
          <span>Detail View</span>
        </button>

        <button
          className={`
            ${style.floatingButton}
            ${style.nodeSearchButton}
          `}
          onClick={() => setShowSearch(!showSearch)}
        >
          <FontAwesomeIcon
            icon={faSearch}
          />
        </button>
        {showSearch &&
          <NodeSearch
            className={style.nodeSearch}
            nodes={graphData && graphData.nodes}
            selectedNodes={selectedNodes}
            onSelect={node => {
              dispatch(setSelectedNodes([node]))
              dispatch(setDetailViewToEgoGraph(node))
            }}
          />}

        <AnswererGraph
          className={style.mainGraph}
          data={graphData}
          onRetryLoading={() => dispatch(fetchAnswererGraph())}
        />
        <div className={style.marginProvider}>
          <DetailView
            isVisible={showDetailGraph}
            onClose={() => onDetailViewClose()}
            data={detailViewData}
          />
        </div>
        <div className={style.userStats}>
          <UserStats
            data={userData}
          />
        </div>
      </div>
    </div>
  )
}

export default Home
