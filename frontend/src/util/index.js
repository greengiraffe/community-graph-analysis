import debounce from 'just-debounce'
import { useRef } from 'preact/hooks'
import { useDispatch } from 'react-redux'
import { DataSet } from 'vis-data'

/**
 * A hook that creates a persistent reference
 * to an object of two vis.js DataSets by using
 * Preacts useRef hook. The returned object has
 * two fields, `nodes` and `edges`, each of them
 * holds a DataSet:
 *
 * ```js
 * {
 *    nodes: DataSet,
 *    edges: DataSet
 * }
 * ```
 * @param {object} options Options to pass to both datasets
 * @returns A reference to the datasets object
 */
export function useDatasets (options = {}) {
  const datasetsRef = useRef({
    nodes: new DataSet(options),
    edges: new DataSet(options)
  })

  return datasetsRef.current
}

/**
 * Debounce (or throttle) a Redux dispatch
 *
 * @param {number} delay delay in ms
 * @param {boolean} guarantee act like a throttle, dispatch every `delay` ms
 * @returns a hook to debounce/throttle a dispatch
 */
export function useDebouncedDispatch (delay, throttle) {
  const dispatch = useDispatch()
  return debounce(dispatch, delay, false, throttle)
}

/**
 * Compares two objects using `JSON.stringify()`.
 * Only use for small objects. Note that the order of
 * the properties is important.
 *
 * @param {object} a Object A
 * @param {object} b Object B
 * @returns {boolean} true if the objects are equal, false otherwise
 */
export function objectsEqual (a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * Returns a given string in a lowercased version
 * where all spaces are replaced by `-`
 *
 * @param {string} text The string to transform
 * @returns the transformed string
 */
export function idFromString (text) {
  return text.toLowerCase().replace(/\s+/g, '-')
}
