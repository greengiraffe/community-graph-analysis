import { Link } from 'preact-router/match'
import style from './style.css'

const Header = () => (
  <header class={style.header}>
    <h1>Community Graph Analysis</h1>
    <nav>
      <Link activeClassName={style.active} href='/'>Answerer Network</Link>
      <Link activeClassName={style.active} href='/departments'>Department Network</Link>
      {/* <Link activeClassName={style.active} href='/test'>Test</Link> */}
    </nav>
  </header>
)

export default Header
