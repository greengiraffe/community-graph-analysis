import { configureStore } from '@reduxjs/toolkit'
import departmentsGraphReducer from './slices/DepartmentGraphSlice'
import answererGraphReducer from './slices/AnswererGraphSlice'
import userDataReducer from './slices/UserDataSlice'

export default configureStore({
  reducer: {
    departmentsGraph: departmentsGraphReducer,
    answererGraph: answererGraphReducer,
    userData: userDataReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false
    })
})
