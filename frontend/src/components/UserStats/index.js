import { useState } from 'preact/hooks'
import { HeatMapCanvas } from '@nivo/heatmap'
import { Bar } from '@nivo/bar'
import { Pie } from '@nivo/pie'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons'
import Widget from './Widget'
import AnimateHeight from 'react-animate-height'
import style from './style.css'

function UserStats ({ data }) {
  const [expand, setExpand] = useState(false)

  const heatmapKeys = Array.from(Array(24).keys())

  function getDates () {
    const firstDate = new Date(data.firstPostDate)
    const lastDate = new Date(data.lastPostDate)
    return (
      <>
        <span className={style.metaWrapper}>
          <span className={style.metaText}>First Post</span>
          <time
            dateTime={firstDate.toISOString()}
            title={firstDate.toLocaleString()}
            className={style.metaValue}
          >{firstDate.toLocaleDateString()}
          </time>
        </span>
        <span className={style.metaWrapper}>
          <span className={style.metaText}>Latest Post</span>
          <time
            dateTime={lastDate.toISOString()}
            title={lastDate.toLocaleString()}
            className={style.metaValue}
          >{lastDate.toLocaleDateString()}
          </time>
        </span>
      </>
    )
  }

  function getMetaStats () {
    const num = Number.parseInt(data.commentStats.total, 10).toLocaleString('de', { useGrouping: true })
    return (
      <>
        <span className={style.metaWrapper}>
          <span className={style.metaText}># of Comments</span>
          <span className={style.metaValue}>{num}
          </span>
        </span>
      </>
    )
  }

  return (data &&
    <div class={style.wrapper}>
      <header class={style.header}>
        <h2>{data.randomName}</h2>
        {getMetaStats()}
        {getDates()}
        <FontAwesomeIcon
          icon={expand ? faCaretDown : faCaretUp}
          size='2x'
          onClick={() => setExpand(!expand)}
        />
      </header>
      <AnimateHeight height={expand ? 'auto' : 0}>
        <div class={style.widgetWrapper}>
          <Widget title='Daily Activity'>
            {data.timeHeatmap && (
              <HeatMapCanvas
                data={data.timeHeatmap}
                pixelRatio={2}
                keys={heatmapKeys}
                indexBy='day'
                width={400}
                height={200}
                // cellShape='square'
                // sizeVariation={0.2}
                // forceSquare
                padding={0.25}
                colors='YlGn'
                enableLabels={false}
                isInteractive
                animate
                cellOpacity={1}
                cellHoverOthersOpacity={0.5}
                // hoverTarget='cell'
                tooltip={data => (
                  <>
                    {data.yKey.toUpperCase()} {data.xKey}:00 - {data.xKey + 1}
                    :00 - {data.value} comments
                  </>
                )}
                axisTop={{
                  tickSize: 4,
                  tickPadding: 8,
                  tickValues: [0, 11, 12, 23]
                }}
                axisLeft={{
                  tickSize: 4,
                  tickPadding: 8
                }}
                margin={{
                  top: 24,
                  left: 48,
                  bottom: 24,
                  right: 24
                }}
              />
            )}
          </Widget>

          <Widget title='Weekly Activity'>
            {data.weekHistogram && (
              <Bar
                data={data.weekHistogram}
                colors={['#666']}
                colorBy='id'
                padding={0.2}
                enableGridY
                gridYValues={3}
                width={350}
                height={200}
                enableLabel={false}
                animate
                label
                axisLeft={{
                  tickValues: 3
                }}
                tooltip={data => <>{data.value}</>}
                axisBottom={{
                  tickSize: 1,
                  tickPadding: 12
                }}
                margin={{
                  top: 24,
                  left: 48,
                  bottom: 24,
                  right: 48
                }}
              />
            )}
          </Widget>

          <Widget title='Departments'>
            {data.departments && (
              <Pie
                data={data.departments}
                id='dep'
                value='count'
                colors={['#5a5ddf',
                  '#a14bdb',
                  '#73da3f',
                  '#e0558e',
                  '#dc42bf',
                  '#bb89cd',
                  '#008638',
                  '#d3858b',
                  '#80d69b',
                  '#026ec0',
                  '#d52300',
                  '#ffcc51',
                  '#5990ed',
                  '#cb7a30',
                  '#b9d54d',
                  '#58b9c6',
                  '#afa660',
                  '#d64f4b']}
                sortByValue
                enableRadialLabels
                radialLabelsSkipAngle={10}
                radialLabelsLinkDiagonalLength={10}
                radialLabelsLinkHorizontalLength={10}
                radialLabelsLinkColor={{ from: 'color' }}
                enableSliceLabels
                sliceLabelsSkipAngle={15}
                width={350}
                height={200}
                borderWidth={1}
                innerRadius={0.4}
                pixelRatio={2}
                padAngle={2}
                margin={{
                  top: 24,
                  left: 64,
                  bottom: 24,
                  right: 64
                }}
              />
            )}
          </Widget>
        </div>
      </AnimateHeight>
    </div>
  )
}

export default UserStats
