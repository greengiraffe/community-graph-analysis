import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { LOADING_STATUS } from './globals'
import API from '../../api'

export const fetchDepartmentGraph = createAsyncThunk('depsGraph/getGraph',
  async () => {
    return await API.getDepartmentGraph()
  }
)

export const departmentsGraphSlice = createSlice({
  name: 'depsGraph',
  initialState: {
    status: LOADING_STATUS.idle,
    data: {},
    error: null
  },
  reducers: {
    updateData (state, action) {
      state.data = action.payload
    }
  },
  extraReducers: {
    [fetchDepartmentGraph.pending]: (state) => {
      state.status = LOADING_STATUS.loading
    },
    [fetchDepartmentGraph.fulfilled]: (state, action) => {
      state.status = LOADING_STATUS.succeeded
      state.data = action.payload
    },
    [fetchDepartmentGraph.rejected]: (state, action) => {
      state.status = LOADING_STATUS.failed
      state.error = action.error.message
    }
  }
})

// Extract the action creators object and the reducer
const { actions, reducer } = departmentsGraphSlice

// Extract and export each action creator by name
export const { updateData } = actions

// Export the reducer, either as a default or named export
export default reducer
