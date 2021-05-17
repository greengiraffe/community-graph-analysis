import { useState } from 'preact/hooks'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretDown, faCaretUp, faEye, faEyeSlash, faInfoCircle, faSync } from '@fortawesome/free-solid-svg-icons'
import style from './style.css'
import AnimateHeight from 'react-animate-height'

const SidebarSection = ({
  title = '',
  isCollapsible = false,
  isActivatable = false,
  collapsed = false,
  active = false,
  hasReload = false,
  onReload = () => {},
  tooltip,
  onToggleActive = () => { },
  children
}) => {
  const [isCollapsed, setCollapsed] = useState(collapsed)
  const [isActive, setActive] = useState(active)
  // const [showReload, setShowReload] = useState(hasReload)

  function toggleActive (e) {
    e.stopPropagation()
    if (isActivatable) {
      setActive(!isActive)
      if (typeof onToggleActive === 'function') {
        onToggleActive(!isActive)
      }
    }
  }

  function toggleCollapsed (e) {
    e.stopPropagation()
    if (isCollapsible) {
      setCollapsed(!isCollapsed)
    }
  }

  function reload (e) {
    e.stopPropagation()
    // setShowReload(false)
    if (typeof onReload === 'function') {
      onReload()
    }
  }

  return (
    <section class={style.sidebarSection}>
      <header class={style.sidebarSectionHeader} onClick={(e) => toggleCollapsed(e)}>
        <h2 class={style.sidebarSectionTitle}>{title}</h2>
        {tooltip &&
          <FontAwesomeIcon
            className={style.tooltipIcon}
            size='1x'
            icon={faInfoCircle}
            data-tip={tooltip}
          />}
        <div class={style.sidebarSectionIcons}>
          {hasReload && <FontAwesomeIcon size='1x' icon={faSync} onClick={reload} />}
          {isActivatable && <FontAwesomeIcon
            size='1x'
            icon={isActive ? faEye : faEyeSlash}
            onClick={toggleActive}
            title={isActive ? 'Disable Section' : 'Enable Section'}
                            />}
          {isCollapsible && <FontAwesomeIcon size='2x' fixedWidth icon={isCollapsed ? faCaretDown : faCaretUp} onClick={toggleCollapsed} />}
        </div>
      </header>
      <AnimateHeight height={isCollapsed ? 0 : 'auto'}>
        <div className={style.sidebarSectionContent}>
          {children}
        </div>
      </AnimateHeight>
    </section>
  )
}

export default SidebarSection
