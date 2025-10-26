import { useState } from 'react'

interface PromptModalProps {
  show: boolean
  title: string
  message: string
  defaultValue?: string
  onSubmit: (value: string) => void
  onCancel: () => void
}

export function PromptModal({ show, title, message, defaultValue = '', onSubmit, onCancel }: PromptModalProps) {
  const [value, setValue] = useState(defaultValue)

  if (!show) return null

  const handleSubmit = () => {
    onSubmit(value)
    setValue('')
  }

  const handleCancel = () => {
    onCancel()
    setValue('')
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        background: 'white',
        padding: 24,
        borderRadius: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        minWidth: 400,
        maxWidth: 600
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 18 }}>{title}</h3>
        <p style={{ margin: '0 0 16px 0', fontSize: 14, color: '#666', whiteSpace: 'pre-line' }}>
          {message}
        </p>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSubmit()
            } else if (e.key === 'Escape') {
              handleCancel()
            }
          }}
          style={{
            width: '100%',
            padding: 12,
            fontSize: 16,
            border: '2px solid #ddd',
            borderRadius: 4,
            fontFamily: 'monospace'
          }}
        />
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '8px 16px',
              background: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '8px 16px',
              background: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook para usar o modal de forma mais fácil
export function usePrompt() {
  const [config, setConfig] = useState<{
    show: boolean
    title: string
    message: string
    defaultValue: string
    resolve: (value: string | null) => void
  } | null>(null)

  const prompt = (message: string, defaultValue = '', title = 'Entrada') => {
    return new Promise<string | null>((resolve) => {
      setConfig({
        show: true,
        title,
        message,
        defaultValue,
        resolve
      })
    })
  }

  const handleSubmit = (value: string) => {
    if (config) {
      config.resolve(value)
      setConfig(null)
    }
  }

  const handleCancel = () => {
    if (config) {
      config.resolve(null)
      setConfig(null)
    }
  }

  const PromptComponent = config ? (
    <PromptModal
      show={config.show}
      title={config.title}
      message={config.message}
      defaultValue={config.defaultValue}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  ) : null

  return { prompt, PromptComponent }
}
