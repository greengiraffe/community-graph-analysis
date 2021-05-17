import { useDispatch, useSelector } from 'react-redux'
import { updateDetailView } from '../../store/slices/AnswererGraphSlice'
import DetailGraph from './DetailGraph'
import Modal from '../Modal'
import style from './style.css'

function DetailView ({ onClose, isVisible, data }) {
  const detailView = useSelector(state => state.answererGraph.detailView)
  const dispatch = useDispatch()

  function updateDetailViewSize ({ x, y, deltaWidth, deltaHeight }) {
    const newPos = {
      x,
      y,
      width: detailView.width + deltaWidth,
      height: detailView.height + deltaHeight
    }
    dispatch(updateDetailView(newPos))
  }

  function title () {
    if (!data) return (<strong>Detail View</strong>)

    const nodesForTitle = data.nodes.filter(n => n.group === 'detailView')
    if (nodesForTitle.length === 1) {
      return (
        <span><strong>{nodesForTitle[0].label}</strong> (Ego View)</span>
      )
    }
    const title = nodesForTitle
      .map(n => n.label)
      .join(', ')
    return (
      <strong>{title}</strong>
    )
  }

  return (
    <Modal
      show={isVisible}
      onClose={() => onClose()}
      onResizeStop={updateDetailViewSize}
      onDragStop={(pos) => dispatch(updateDetailView(pos))}
      position={{ x: detailView.x, y: detailView.y }}
      title={title()}
      size={{ width: detailView.width, height: detailView.height }}
    >
      {data
        ? <DetailGraph
            data={data}
          />
        : <div className={style.placeholder}><p>Select some nodes in the main graph</p></div>}
    </Modal>
  )
}

export default DetailView
