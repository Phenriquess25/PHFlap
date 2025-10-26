import { TMConfiguration, BLANK } from '@model/turing'

interface TapeVisualizerProps {
  config: TMConfiguration
  highlightHead?: boolean
}

export default function TapeVisualizer({ config, highlightHead = true }: TapeVisualizerProps) {
  const { tape, head } = config
  
  // Mostrar janela de 15 células ao redor da cabeça
  const windowSize = 15
  const start = Math.max(0, head - Math.floor(windowSize / 2))
  const end = Math.min(tape.length, start + windowSize)
  
  const visibleTape = tape.slice(start, end)
  const headOffset = head - start
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      padding: '1rem',
      background: '#f5f5f5',
      borderRadius: '8px',
      fontFamily: 'monospace'
    }}>
      <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 'bold' }}>
        📼 Fita (posição {head})
      </div>
      
      {/* Células da fita */}
      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        {start > 0 && <span style={{ color: '#999' }}>...</span>}
        
        {visibleTape.map((symbol, i) => {
          const isHead = i === headOffset
          return (
            <div
              key={start + i}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: isHead && highlightHead ? '2px solid #2196f3' : '1px solid #ccc',
                background: isHead && highlightHead ? '#e3f2fd' : 'white',
                fontWeight: isHead && highlightHead ? 'bold' : 'normal',
                fontSize: '14px',
                borderRadius: '4px',
                position: 'relative'
              }}
            >
              {symbol === BLANK ? '␣' : symbol}
              {isHead && highlightHead && (
                <div style={{
                  position: 'absolute',
                  bottom: '-18px',
                  fontSize: '16px',
                  color: '#2196f3'
                }}>
                  ▲
                </div>
              )}
            </div>
          )
        })}
        
        {end < tape.length && <span style={{ color: '#999' }}>...</span>}
      </div>
      
      {highlightHead && (
        <div style={{ fontSize: '0.75rem', color: '#2196f3', marginTop: '1rem' }}>
          ▲ Cabeça de leitura/escrita
        </div>
      )}
    </div>
  )
}
