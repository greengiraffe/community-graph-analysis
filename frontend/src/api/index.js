const BASE_URL = 'http://localhost:5000'

function urlWithSearchParams (url, searchParams) {
  const urlObj = new URL(url)
  const params = new URLSearchParams(searchParams)
  urlObj.search = params.toString()
  return urlObj.toString()
}

const API = {
  async getDepartmentGraph () {
    const res = await window.fetch(`${BASE_URL}/departments-graph`)
    const data = await res.json()
    return data
  },

  async getAnswererGraph ({
    answerThreshold = 30,
    selfloops = false,
    largestSubgraphOnly = false
  }) {
    const url = urlWithSearchParams(`${BASE_URL}/answerer-graph`, {
      answerThreshold,
      selfloops: selfloops ? 1 : 0,
      largestSubgraphOnly: largestSubgraphOnly ? 1 : 0
    })
    const res = await window.fetch(url)
    const data = await res.json()
    return data
  },

  async getUserPostHeatmap (userId) {
    const url = urlWithSearchParams(`${BASE_URL}/user-post-heatmap`, { userId })
    const res = await window.fetch(url)
    const data = await res.json()
    return data
  },

  async getUserData (userId) {
    const url = urlWithSearchParams(`${BASE_URL}/user`, { userId })
    const res = await window.fetch(url)
    const data = await res.json()
    return data
  }
}

export default API
