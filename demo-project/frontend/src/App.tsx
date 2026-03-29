import { useState, useEffect } from 'react'

interface Item {
  id: string
  title: string
  status: string
  created_at: string
}

export function App() {
  const [items, setItems] = useState<Item[]>([])
  const [title, setTitle] = useState('')

  useEffect(() => {
    fetch('/api/items')
      .then(r => r.json())
      .then(setItems)
      .catch(() => {})
  }, [])

  const addItem = () => {
    if (!title.trim()) return
    fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: String(Date.now()), title, status: 'todo' }),
    })
      .then(r => r.json())
      .then(item => { setItems(prev => [...prev, item]); setTitle('') })
      .catch(() => {})
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20, fontFamily: 'system-ui' }}>
      <h1>Demo App</h1>
      <p style={{ color: '#666' }}>A minimal app for testing LLM Kanban GitHub integration</p>

      <div style={{ display: 'flex', gap: 8, margin: '20px 0' }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="New item..."
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6 }}
          onKeyDown={e => e.key === 'Enter' && addItem()}
        />
        <button onClick={addItem} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#000', color: '#fff', cursor: 'pointer' }}>
          Add
        </button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map(item => (
          <li key={item.id} style={{ padding: '12px 16px', border: '1px solid #eee', borderRadius: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span>{item.title}</span>
            <span style={{ fontSize: 12, color: '#999', textTransform: 'uppercase' }}>{item.status}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
