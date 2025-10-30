import { memo, useState } from 'react'
import { useAutomataStore } from '@state/store'
import { usePrompt } from './PromptModal'

type Props = {
  onBack?: () => void
  onDeterminize: () => void
  onEpsilonRemoval?: () => void
  onMinimize?: () => void
  onSimulate: () => void
  inputs: string[]
  setInputs: (inputs: string[]) => void
  showMultiInput: boolean
  setShowMultiInput: (show: boolean) => void
}

export default memo(function Toolbar({ 
  onBack,
  onDeterminize, 
  onEpsilonRemoval, 
  onMinimize, 
  onSimulate, 
  inputs,
  setInputs,
  showMultiInput,
  setShowMultiInput
}: Props) {
  const { fa, createNewFA, clearFA } = useAutomataStore()
  const [showInputModal, setShowInputModal] = useState(false)
  const { prompt, PromptComponent } = usePrompt()
  
  return (
    <>
      {PromptComponent}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid #ddd', background: '#f5f5f5' }}>
        {/* Botão Voltar */}
        {onBack && (
          <>
            <button
              onClick={onBack}
              title="Voltar ao menu principal"
              style={{ 
                padding: '6px 12px', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              ← Menu
            </button>
            <div style={{ width: 1, height: 24, background: '#ccc', margin: '0 4px' }} />
          </>
        )}
        
        <strong style={{ fontSize: 16 }}>🔧 FA Editor</strong>
        
        {/* Separador */}
        <div style={{ width: 1, height: 24, background: '#ccc', margin: '0 4px' }} />
        
        {/* Criação de autômatos */}
        <button
          onClick={() => {
            if (!fa || window.confirm('Criar novo AFN? (perderá o autômato atual)')) {
              createNewFA('NFA')
            }
          }}
          title="Criar novo Autômato Finito Não-Determinístico"
          style={{ padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          📝 Novo AFN
        </button>
        <button
          onClick={() => {
            if (!fa || window.confirm('Criar novo AFD? (perderá o autômato atual)')) {
              createNewFA('DFA')
            }
          }}
          title="Criar novo Autômato Finito Determinístico"
          style={{ padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          📝 Novo AFD
        </button>
        <button
          onClick={async () => {
            const confirm = await prompt('Limpar todos os estados? (mantém o tipo)\n\nDigite "sim" para confirmar:', '')
            if (confirm?.toLowerCase() === 'sim') {
              clearFA()
            }
          }}
          title="Limpar autômato atual"
          style={{ padding: '6px 12px', cursor: 'pointer', color: '#d9534f' }}
        >
          🗑️ Limpar
        </button>
        
        {/* Separador */}
        <div style={{ width: 1, height: 24, background: '#ccc', margin: '0 4px' }} />
        
        {/* Conversões */}
        <button onClick={onDeterminize} style={{ padding: '6px 12px', cursor: 'pointer' }}>
          ⚡ Determinizar
        </button>
        {onEpsilonRemoval && (
          <button onClick={onEpsilonRemoval} style={{ padding: '6px 12px', cursor: 'pointer' }}>
            🔄 Remover ε
          </button>
        )}
        {onMinimize && (
          <button onClick={onMinimize} style={{ padding: '6px 12px', cursor: 'pointer' }}>
            📉 Minimizar
          </button>
        )}
        
        {/* Separador */}
        <div style={{ width: 1, height: 24, background: '#ccc', margin: '0 4px' }} />
        
        {/* Simulação */}
        <button
          onClick={() => setShowInputModal(true)}
          style={{ 
            padding: '6px 12px', 
            cursor: 'pointer', 
            background: showMultiInput ? '#ff9800' : '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            fontWeight: 'bold'
          }}
          title={showMultiInput ? 'Modo: Múltiplas Entradas' : 'Modo: Entrada Única'}
        >
          {showMultiInput ? '📋 Entradas' : '📝 Entrada'} ({inputs.length})
        </button>
        <button 
          onClick={onSimulate} 
          style={{ 
            padding: '6px 12px', 
            cursor: 'pointer', 
            background: '#5cb85c', 
            color: 'white', 
            border: 'none', 
            borderRadius: 4,
            fontWeight: 'bold'
          }}
        >
          ▶️ Simular {showMultiInput ? `${inputs.length} entradas` : ''}
        </button>
        
        {/* Info do autômato atual */}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#666' }}>
          <strong>Tipo:</strong> {fa?.type || '—'}
        </div>
      </div>

      {/* Modal de entradas */}
      {showInputModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: 24,
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            minWidth: 500,
            maxWidth: 600,
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 16px 0' }}>🎯 Configurar Entradas para Simulação</h3>
            
            {/* Toggle modo */}
            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowMultiInput(false)}
                style={{
                  padding: '8px 16px',
                  background: !showMultiInput ? '#2196f3' : '#e0e0e0',
                  color: !showMultiInput ? 'white' : '#666',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                📝 Entrada Única
              </button>
              <button
                onClick={() => setShowMultiInput(true)}
                style={{
                  padding: '8px 16px',
                  background: showMultiInput ? '#ff9800' : '#e0e0e0',
                  color: showMultiInput ? 'white' : '#666',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                📋 Múltiplas Entradas
              </button>
            </div>

            {showMultiInput ? (
              <>
                <p style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
                  Digite uma cadeia por linha. Cada uma será testada separadamente.
                </p>
                <textarea
                  value={inputs.join('\n')}
                  onChange={(e) => setInputs(e.target.value.split('\n'))}
                  placeholder="aaba&#10;aabaab&#10;bbba&#10;bb"
                  style={{
                    width: '100%',
                    height: 200,
                    padding: 12,
                    fontFamily: 'monospace',
                    fontSize: 14,
                    border: '2px solid #ddd',
                    borderRadius: 4,
                    resize: 'vertical'
                  }}
                  onKeyDown={(e) => {
                    // Permitir Enter para quebrar linha
                    if (e.key === 'Enter') {
                      e.stopPropagation()
                    }
                  }}
                />
                <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                  Total: {inputs.length} cadeia(s)
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
                  Digite a cadeia a ser testada:
                </p>
                <input
                  type="text"
                  value={inputs[0] || ''}
                  onChange={(e) => setInputs([e.target.value])}
                  placeholder="exemplo: aaba"
                  style={{
                    width: '100%',
                    padding: 12,
                    fontFamily: 'monospace',
                    fontSize: 16,
                    border: '2px solid #ddd',
                    borderRadius: 4
                  }}
                />
              </>
            )}

            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowInputModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#f0f0f0',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setShowInputModal(false)
                  onSimulate()
                }}
                style={{
                  padding: '8px 16px',
                  background: '#5cb85c',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ▶️ Simular Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
})
