import { faUndo } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useMemo, useState } from 'preact/hooks'
import { Range } from 'rc-slider'
import 'rc-slider/assets/index.css'
import style from './style.css'

export default function RangeSlider ({
  title,
  min,
  max,
  value,
  step = 1,
  disabled = false,
  formatValue = (num) => num,
  onChange = () => { },
  className = ''
}) {
  const [localVal, setLocalVal] = useState(value)
  const showReset = useMemo(() => {
    return (
      localVal[0] !== min ||
      localVal[1] !== max
    )
  }, [localVal, min, max])
  const id = title.toLowerCase().replace(/\s+/g, '-')

  function change (value) {
    setLocalVal(value)
    onChange(value)
  }

  return (
    <div className={`${style.rangeFilter} ${className}`}>
      <label class={style.rangeLabel} id={id}>
        {title}
        {showReset &&
          <FontAwesomeIcon
            icon={faUndo}
            className={style.rangeResetIcon}
            onClick={() => change([min, max])}
          />}
      </label>
      <div className={style.rangeWrapper}>
        <div className={style.rangeValueMin}>{formatValue(localVal[0])}</div>
        <Range
          disabled={disabled}
          step={step}
          min={min}
          max={max}
          defaultValue={value}
          value={localVal}
          allowCross
          onChange={(val) => change(val)}
          ariaLabelGroupForHandles={[id, id]}
        />
        <div className={style.rangeValueMax}>{formatValue(localVal[1])}</div>
      </div>
    </div>
  )
}
