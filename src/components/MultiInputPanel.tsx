import { useState, useRef, useCallback, useEffect } from 'react'

interface MultiInputPanelProps {
  onSimulate: (inputs: string[]) => void
  disabled?: boolean
  placeholder?: string
}

export default function MultiInputPanel({ onSimulate, disabled = false, placeholder = 'ex: aabb' }: MultiInputPanelProps) {
  const [inputs, setInputs] = useState<string[]>([''])
  const [showMultiInput, setShowMultiInput] = useState(false)
  const [multiInputHeight, setMultiInputHeight] = useState(150)
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartY = useRef(0)
  const resizeStartHeight = useRef(0)

  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true)
    resizeStartY.current = e.clientY
    resizeStartHeight.current = multiInputHeight
  }

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return
    const delta = e.clientY - resizeStartY.current
    const newHeight = Math.max(100, Math.min(600, resizeStartHeight.current + delta))
    setMultiInputHeight(newHeight)
  }, [isResizing, multiInputHeight])

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
  }, [])

  // Event listeners for resize
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove)
      window.addEventListener('mouseup', handleResizeEnd)
      return () => {
        window.removeEventListener('mousemove', handleResizeMove)
        window.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [isResizing, handleResizeMove, handleResizeEnd])

  const addInput = () => {
    setInputs([...inputs, ''])
  }

  const removeInput = (index: number) => {
    setInputs(inputs.filter((_, i) => i !== index))
  }

  const updateInput = (index: number, value: string) => {
    const newInputs = [...inputs]
    newInputs[index] = value
    setInputs(newInputs)
  }

  const handleSimulate = () => {
    const validInputs = showMultiInput 
      ? inputs.filter(i => i.trim()) 
      : [inputs[0] || '']
    onSimulate(validInputs)
  }

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Toggle Single/Multiple */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button
          onClick={() => setShowMultiInput(false)}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '6px',
            background: !showMultiInput ? '#2196f3' : '#e0e0e0',
            color: !showMultiInput ? 'white' : '#666',
            border: 'none',
            borderRadius: 4,
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: 12,
            fontWeight: !showMultiInput ? 'bold' : 'normal'
          }}
        >
          📝 Única
        </button>
        <button
          onClick={() => setShowMultiInput(true)}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '6px',
            background: showMultiInput ? '#ff9800' : '#e0e0e0',
            color: showMultiInput ? 'white' : '#666',
            border: 'none',
            borderRadius: 4,
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: 12,
            fontWeight: showMultiInput ? 'bold' : 'normal'
          }}
        >
          📋 Múltiplas
        </button>
      </div>

      {/* Input Area */}
      {showMultiInput ? (
        <div style={{ position: 'relative' }}>
          <div 
            style={{ 
              height: multiInputHeight,
              maxHeight: '300px',
              overflow: 'auto', 
              marginBottom: 8,
              border: '1px solid #ddd',
              borderRadius: 4,
              padding: 8,
              background: '#fafafa'
            }}
          >
            {inputs.map((input, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => updateInput(idx, e.target.value)}
                  placeholder={`${placeholder} #${idx + 1}`}
                  disabled={disabled}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: 13,
                    background: '#fff'
                  }}
                />
                {inputs.length > 1 && (
                  <button
                    onClick={() => removeInput(idx)}
                    disabled={disabled}
                    style={{
                      padding: '6px 10px',
                      background: '#E53E3E',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      fontSize: 12
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addInput}
              disabled={disabled}
              style={{
                width: '100%',
                padding: '6px',
                background: '#48BB78',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            >
              + Adicionar Entrada
            </button>
          </div>
          
          {/* Resize Handle */}
          <div
            onMouseDown={handleResizeStart}
            style={{
              width: '100%',
              height: 8,
              background: isResizing ? '#2196f3' : '#e0e0e0',
              cursor: 'ns-resize',
              borderRadius: 4,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: '#666',
              userSelect: 'none',
              transition: 'background 0.2s'
            }}
            title="Arraste para redimensionar"
          >
            ⋮⋮⋮
          </div>
        </div>
      ) : (
        <input
          type="text"
          value={inputs[0] || ''}
          onChange={(e) => updateInput(0, e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '6px 10px',
            border: '1px solid #ddd',
            borderRadius: 4,
            fontSize: 13,
            marginBottom: 8
          }}
        />
      )}

      {/* Simulate Button */}
      <button
        onClick={handleSimulate}
        disabled={disabled || (showMultiInput ? inputs.filter(i => i.trim()).length === 0 : !inputs[0]?.trim())}
        style={{
          width: '100%',
          padding: '8px',
          background: disabled ? '#ccc' : '#0066ff',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          fontSize: 13
        }}
      >
        ▶️ Simular {showMultiInput ? `(${inputs.filter(i => i.trim()).length} entradas)` : ''}
      </button>
    </div>
  )
}
