import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { LOADING_STATUS } from './globals'
import API from '../../api'

export const fetchUserData = createAsyncThunk('userData/fetchUserData',
  async (userId) => {
    return await API.getUserData(userId)
  }
)

export const userDataSlice = createSlice({
  name: 'userData',
  initialState: {
    status: LOADING_STATUS.idle,
    error: null,
    data: null
  },
  reducers: {
  },
  extraReducers: {
    [fetchUserData.pending]: (state) => {
      state.status = LOADING_STATUS.loading
    },
    [fetchUserData.fulfilled]: (state, action) => {
      state.status = LOADING_STATUS.succeeded
      state.data = action.payload
    },
    [fetchUserData.rejected]: (state, action) => {
      state.status = LOADING_STATUS.failed
      state.error = action.error.message
    }
  }
})

// Extract the action creators object and the reducer
const { reducer } = userDataSlice

// Extract and export each action creator by name
// export const {  } = actions

// Export the reducer, either as a default or named export
export default reducer
