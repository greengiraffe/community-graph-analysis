import { faWindowClose } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Rnd } from 'react-rnd'
import style from './style.css'

function Modal ({
  show,
  onClose,
  onDragStop,
  onResizeStop,
  position = { x: 0, y: 0 },
  size = { width: 300, height: 400 },
  title = '',
  children
}) {
  function close (e) {
    (typeof onClose === 'function') && onClose(e)
  }

  function dragStop (evt, { x, y }) {
    (typeof onDragStop === 'function') && onDragStop({ x, y })
  }

  function resizeStop (evt, dir, refToElement, delta, position) {
    (typeof onResizeStop === 'function') && onResizeStop({
      x: position.x,
      y: position.y,
      deltaWidth: delta.width,
      deltaHeight: delta.height
    })
  }

  if (show) {
    return (
      <Rnd
        dragHandleClassName='modalHandleRef'
        minWidth='25%'
        minHeight='25%'
        maxWidth='100%'
        maxHeight='100%'
        className={style.modalWrapper}
        bounds='parent'
        onDragStop={dragStop}
        onResizeStop={resizeStop}
        position={position}
        size={size}
      >
        <div class={`${style.modalHandle} modalHandleRef`}>
          <span class={style.modalTitle}>{title}</span>
          <button onClick={close} class={style.modalButton}><FontAwesomeIcon className={style.icon} icon={faWindowClose} fixedWidth /></button>
        </div>
        <div class={style.modalContent}>
          {children}
        </div>
      </Rnd>
    )
  }
  return null
}

export default Modal
