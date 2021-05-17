import { useMemo, useState } from 'preact/hooks'
import style from './style.css'

export default function NodeSearch ({
  className,
  nodes,
  selectedNodes,
  onSelect = () => {}
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const filteredNodes = useMemo(() => {
    if (nodes === null) return
    return nodes
      .filter(n => n.label.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [searchTerm, nodes])

  console.log(selectedNodes)
  return nodes && (
    <div className={`${style.wrapper} ${className}`}>
      <input
        className={style.searchInput}
        type='text'
        placeholder='Search for a node'
        value={searchTerm}
        onChange={(evt) => setSearchTerm(evt.target.value)}
      />
      <ul className={style.list}>
        {filteredNodes.map(node => {
          const selected = selectedNodes && selectedNodes.some(n => node.id === n.id)
          return <ListItem node={node} key={node.id} onSelect={onSelect} selected={selected} />
        })}
      </ul>
    </div>
  )
}

function ListItem ({ node, selected, onSelect }) {
  return (
    <li
      className={`${style.listItem} ${selected && style.selected}`}
      onClick={() => onSelect(node)}
    > {node.label}
    </li>
  )
}
