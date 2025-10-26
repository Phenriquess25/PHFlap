import { useAutomataStore } from '@state/store'

export default function StepperPanel() {
  const { trace } = useAutomataStore()
  return (
    <div style={{ borderTop: '1px solid #ddd', overflow: 'auto' }}>
      <div style={{ padding: 8, background: '#f6f8fa', borderBottom: '1px solid #eee' }}>
        <strong>{trace?.title ?? 'Sem passos'}</strong>
      </div>
      <ol style={{ margin: 0, padding: '8px 24px' }}>
        {trace?.steps.map((s, i) => (
          <li key={i} style={{ padding: '4px 0' }}>{s.message}</li>
        ))}
      </ol>
    </div>
  )
}
