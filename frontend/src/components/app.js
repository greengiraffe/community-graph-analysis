import { Router } from 'preact-router'

import Header from './Header'
import store from '../store/store'
import { Provider } from 'react-redux'

// Code-splitting is automated for `routes` directory
import AnswererGraphPage from '../routes/AnswererGraphPage'
import DepartmentsGraphPage from '../routes/DepartmentGraphPage'

const App = () => (
  <Provider store={store}>
    <div id='app'>
      <Header />
      <main id='main'>
        <Router>
          <AnswererGraphPage path='/' />
          <DepartmentsGraphPage path='/departments' />
        </Router>
      </main>
    </div>
  </Provider>
)

export default App
