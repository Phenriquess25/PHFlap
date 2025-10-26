import { useState } from 'react'

interface MultiInputPanelProps {
  onSimulate: (inputs: string[]) => void
  disabled?: boolean
  placeholder?: string
}

export default function MultiInputPanel({ onSimulate, disabled = false, placeholder = 'ex: aabb' }: MultiInputPanelProps) {
  const [inputs, setInputs] = useState<string[]>([''])
  const [showMultiInput, setShowMultiInput] = useState(false)

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
        <div style={{ maxHeight: 150, overflow: 'auto', marginBottom: 8 }}>
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
                  fontSize: 13
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
