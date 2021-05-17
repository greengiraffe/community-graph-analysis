import style from './style.css'

function Widget ({ title, children }) {
  return (
    <div className={style.widget}>
      <div className={style.widgetHeader}>
        <h3>{title}</h3>
      </div>
      <div className={style.widgetContainer}>
        {children}
      </div>
    </div>
  )
}

export default Widget
