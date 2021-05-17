import { useState } from 'preact/hooks'
import { useDispatch, useSelector } from 'react-redux'
import ReactTooltip from 'react-tooltip'
import {
  pauseSimulation,
  setFilterActive,
  updateFilterValue,
  fetchAnswererGraph,
  updateSettings,
  updateFilterProperty,
  triggerFit
} from '../../store/slices/AnswererGraphSlice'
import { objectsEqual, useDebouncedDispatch } from '../../util'
import SidebarSection from './SidebarSection'
import RangeSlider from './RangeSlider'
import style from './style'
import AnimateHeight from 'react-animate-height'
import { CENTRALITY_VALUES, COMMUNITY_VALUES, OPERATORS, RECIPROCITY_SETTINGS } from '../../store/slices/globals'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExpand } from '@fortawesome/free-solid-svg-icons'

function Sidebar ({ description }) {
  const dispatch = useDispatch()
  const debouncedDispatch = useDebouncedDispatch(500, true)
  const simulationPaused = useSelector(
    state => state.answererGraph.simulationPaused
  )
  const simStabilized = useSelector(state => state.answererGraph.stabilized)
  const filters = useSelector(state => state.answererGraph.filters)
  const initialGraphSettings = useSelector(state => state.answererGraph.settings)
  const graphData = useSelector(state => state.answererGraph.data)
  const filteredStats = useSelector(state => state.answererGraph.filteredStats)
  const [graphNeedsReload, setGraphNeedsReload] = useState(false)

  const [graphSettings, setGraphSettings] = useState({
    ...initialGraphSettings
  })

  function onValueChange (filter, value) {
    dispatch(updateFilterValue({ filter, value }))
  }

  function onFilterPropertyChange (filter, property, value, debounced = false) {
    if (debounced) {
      debouncedDispatch(updateFilterProperty({ filter, property, value }))
      return
    }
    dispatch(updateFilterProperty({ filter, property, value }))
  }

  function toggleFilter (filter, isActive) {
    dispatch(setFilterActive({ filter, active: isActive }))
  }

  function updateGraphSettings (setting, evt) {
    let value = Number.parseInt(evt.target.value, 10)
    if (evt.target.type === 'checkbox') {
      value = evt.target.checked
    }
    const updatedGraphSettings = {
      ...graphSettings,
      [setting]: value
    }
    setGraphSettings(updatedGraphSettings)
    setGraphNeedsReload(
      !objectsEqual(initialGraphSettings, updatedGraphSettings)
    )
  }

  function reloadGraph () {
    dispatch(pauseSimulation(true))
    dispatch(updateSettings(graphSettings))
    dispatch(fetchAnswererGraph(graphSettings))
    setGraphNeedsReload(false)
  }

  function stabilizationStatus () {
    if (simulationPaused) {
      return <p>Stabilization paused.</p>
    }

    if (simStabilized) {
      return <p>Stabilization done!</p>
    }

    return <p>Stabilization in progress...</p>
  }

  return (
    <aside class={style.sidebar}>
      <ReactTooltip
        className={style.tooltip}
        place='right'
        type='light'
        event='click'
        globalEventOff='click'
        effect='solid'
      />

      <div className={style.mainArea}>
        <SidebarSection title='About' isCollapsible>
          <p>{description}</p>
        </SidebarSection>

        <SidebarSection
          title='Statistics'
          isCollapsible
          collapsed
          tooltip={`
            The "Loaded" statistics are based on the graph settings.
            The "Filtered" statistics are based on the applied node
            and edge filters applied below.`}
        >
          <table className={style.statsTable}>
            <thead>
              <tr>
                <th />
                <th>Loaded</th>
                <th>Filtered</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td># of Nodes</td>
                <td>{graphData && graphData.stats.node_count}</td>
                <td>{filteredStats.visibleNodes}</td>
              </tr>
              <tr>
                <td># of Edges</td>
                <td>{graphData && graphData.stats.edge_count}</td>
                <td>{filteredStats.visibleEdges}</td>
              </tr>
              <tr>
                <td>Ø Edge Weight</td>
                <td>{graphData && graphData.stats.avg_weight}</td>
                <td>{filteredStats.avgEdgeWeight}</td>
              </tr>
              <tr>
                <td>Reciprocity</td>
                <td>{graphData && `${graphData.stats.reciprocity} %`}</td>
                <td>{`${filteredStats.reciprocity} %`}</td>
              </tr>
            </tbody>
          </table>
        </SidebarSection>

        <SidebarSection
          title='Graph Settings'
          isCollapsible
          collapsed
          isReloadable
          hasReload={graphNeedsReload}
          onReload={() => reloadGraph()}
          tooltip='All of the graph analyses below are based on the graph defined by settings applied here. Changing a setting requires reloading the graph.'
        >
          <label>
            <input
              type='checkbox'
              checked={graphSettings.largestSubgraphOnly}
              onChange={evt => updateGraphSettings('largestSubgraphOnly', evt)}
            />
            Show only the largest connected subgraph
          </label>
          <label>
            <input
              type='checkbox'
              checked={graphSettings.selfloops}
              onChange={evt => updateGraphSettings('selfloops', evt)}
            />
            Show Selfloops
          </label>
          <label class={style.labelWithInput}>
            Minimum Edge-Weight
            <input
              type='number'
              min={30}
              value={graphSettings.answerThreshold}
              onChange={evt => updateGraphSettings('answerThreshold', evt)}
            />
          </label>
          <AnimateHeight height={graphNeedsReload ? 'auto' : 0}>
            <button className={style.updateGraphButton} onClick={() => reloadGraph()}>
              Update Graph
            </button>
          </AnimateHeight>
        </SidebarSection>

        <SidebarSection
          title='Filter Nodes & Edges'
          isCollapsible
          isActivatable
          collapsed
          onToggleActive={isActive => toggleFilter('nodeFilters', isActive)}
          tooltip='Filter graph by edge weight, reciprocity or the ratio of weights of bi-directional edges.'
        >
          <div className={style.sidebarSubSection}>
            <RangeSlider
              title='Edge Weight Range'
              min={graphData && graphData.stats.min_weight}
              max={graphData && graphData.stats.max_weight}
              step={1}
              value={filters.nodeFilters.edgeWeightRange}
              onChange={values =>
                onFilterPropertyChange('nodeFilters', 'edgeWeightRange', values, true)}
            />
          </div>
          <div className={style.sidebarSubSection}>
            <fieldset>
              <legend className={style.sectionSubHeader}>Show edges</legend>
              {Object.values(RECIPROCITY_SETTINGS).map(value => {
                return (
                  <label key={value.key}>
                    <input
                      type='radio'
                      value={value.key}
                      checked={filters.nodeFilters.reciprocal === value.key}
                      onChange={() =>
                        onFilterPropertyChange(
                          'nodeFilters',
                          'reciprocal',
                          value.key
                        )}
                    />
                    {value.name}
                  </label>
                )
              })}
            </fieldset>
          </div>

          <AnimateHeight height={filters.nodeFilters.reciprocal === 'only' ? 'auto' : 0}>
            <div className={style.sidebarSubSection}>
              <RangeSlider
                title='Reciprocal Weight Ratio'
                min={graphData && graphData.stats.min_reciprocal_ratio}
                max={graphData && graphData.stats.max_reciprocal_ratio}
                step={0.01}
                value={filters.nodeFilters.reciprocalWeightRatioRange}
                formatValue={num => num.toFixed(2)}
                onChange={values =>
                  onFilterPropertyChange(
                    'nodeFilters',
                    'reciprocalWeightRatioRange',
                    values,
                    true
                  )}
              />
            </div>
          </AnimateHeight>
        </SidebarSection>

        <SidebarSection
          title='Communities'
          isCollapsible
          isActivatable
          collapsed
          onToggleActive={isActive => toggleFilter('community', isActive)}
          tooltip='Highlight communities using different community detection algorithms.'
        >

          <label class={style.labelWithInput}>Method
            <select name='community' onChange={evt => onValueChange('community', evt.target.value)}>
              {Object.values(COMMUNITY_VALUES).map(value => {
                return (
                  <option
                    key={value.key}
                    value={value.key}
                    selected={filters.community.value === value.key}
                  >{value.name}
                  </option>
                )
              })}
            </select>
          </label>
          <label class={style.labelWithInput}>
            Community size
            <span class={style.inputWithButton}>
              <button
                onClick={() => {
                  switch (filters.community.size[0]) {
                    case OPERATORS.equal:
                      onFilterPropertyChange('community', 'size', [OPERATORS.greaterOrEqual, filters.community.size[1]])
                      break
                    case OPERATORS.greaterOrEqual:
                      onFilterPropertyChange('community', 'size', [OPERATORS.lessOrEqual, filters.community.size[1]])
                      break
                    case OPERATORS.lessOrEqual:
                      onFilterPropertyChange('community', 'size', [OPERATORS.equal, filters.community.size[1]])
                      break
                  }
                }}
              >{filters.community.size[0]}
              </button>
              <input
                type='number'
                min={filters.community[filters.community.value].min}
                max={filters.community[filters.community.value].max}
                value={filters.community.size[1]}
                onChange={evt => onFilterPropertyChange(
                  'community', 'size', [filters.community.size[0], Number.parseInt(evt.target.value, 10)]
                )}
              />
            </span>
          </label>
        </SidebarSection>

        <SidebarSection
          title='Centrality'
          isCollapsible
          isActivatable
          collapsed
          onToggleActive={isActive => toggleFilter('centrality', isActive)}
          tooltip='Highlight well-connected or influential nodes in the graph by applying different centrality metrics.'
        >
          <fieldset>
            {Object.values(CENTRALITY_VALUES).map((value) => {
              return (
                <label key={value.key}>
                  <input
                    type='radio'
                    value={value.key}
                    checked={filters.centrality.value === value.key}
                    onChange={evt => onValueChange('centrality', evt.target.value)}
                  />
                  {value.name}
                </label>
              )
            })}
          </fieldset>
        </SidebarSection>
      </div>

      <div class={style.buttonArea}>
        {stabilizationStatus()}
        <div className={style.buttonAreaButtons}>
          <button onClick={() => dispatch(pauseSimulation(!simulationPaused))}>
            {simulationPaused ? 'Resume Simulation' : 'Pause Simulation'}
          </button>
          <button onClick={() => dispatch(triggerFit())}>
            <FontAwesomeIcon icon={faExpand} />
            Fit
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
