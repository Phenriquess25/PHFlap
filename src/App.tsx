import { useAutomataStore } from '@state/store'
import CanvasEditor from './components/CanvasEditor'
import HomeScreen from '@components/HomeScreen'
import TMScreen from '@components/TMScreen'
import MealyEditor from '@components/MealyEditor'
import MooreEditor from '@components/MooreEditor'
import PDAEditor from '@components/PDAEditor'
import MultiTapeTMEditor from '@components/MultiTapeTMEditor'
import TMBlocksEditor from '@components/TMBlocksEditor'
import { useState } from 'react'
import { useEffect } from 'react'
import { ModelType } from './types/models'

export default function App() {
  const [activeModel, setActiveModel] = useState<ModelType | null>(null) // Inicia na tela de seleção

  // Ask to save when closing the app while inside an editor (works in browser and Electron)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!activeModel) return

      // Ask user if they want to save
      const wantSave = window.confirm('Você está dentro de um editor. Deseja salvar antes de sair?\nOK = Salvar e sair, Cancel = Perguntar se deseja sair sem salvar.')
      if (wantSave) {
        try {
          // call editor-provided save function if available
          // @ts-ignore
          if (window.__phflap_handleSave) window.__phflap_handleSave()
        } catch (err) {
          // ignore
        }
        return
      }

      const exitNoSave = window.confirm('Sair sem salvar?\nOK = Sair sem salvar, Cancel = Voltar ao editor')
      if (!exitNoSave) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
      // else allow unload without saving
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [activeModel])

  // Se nenhum modelo está ativo, mostrar tela inicial
  if (!activeModel) {
    return <HomeScreen onSelectModel={(type) => {
      setActiveModel(type)
      // Se for FA, criar um AFN vazio
      if (type === 'FA') {
        useAutomataStore.getState().createNewFA('NFA')
      }
    }} />
  }

  // Renderizar o editor apropriado para o modelo ativo
  if (activeModel === 'FA') {
    return (
      <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
        <CanvasEditor />
        <button 
          onClick={() => setActiveModel(null)} 
          style={{ 
            position: 'absolute', 
            top: 10, 
            left: 10, 
            zIndex: 1000,
            padding: '8px 16px',
            background: '#fff',
            border: '2px solid #ddd',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          ← Voltar
        </button>
      </div>
    )
  }

  // Máquina de Turing
  if (activeModel === 'TM') {
    return <TMScreen onBack={() => setActiveModel(null)} />
  }

  // Máquina de Mealy
  if (activeModel === 'MEALY') {
    return (
      <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
        <MealyEditor />
        <button 
          onClick={() => setActiveModel(null)} 
          style={{ 
            position: 'absolute', 
            top: 10, 
            left: 10, 
            zIndex: 1000,
            padding: '8px 16px',
            background: '#fff',
            border: '2px solid #ddd',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          ← Voltar
        </button>
      </div>
    )
  }

  // Máquina de Moore
  if (activeModel === 'MOORE') {
    return (
      <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
        <MooreEditor />
        <button 
          onClick={() => setActiveModel(null)} 
          style={{ 
            position: 'absolute', 
            top: 10, 
            left: 10, 
            zIndex: 1000,
            padding: '8px 16px',
            background: '#fff',
            border: '2px solid #ddd',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          ← Voltar
        </button>
      </div>
    )
  }

  // Autômato com Pilha (PDA)
  if (activeModel === 'PDA') {
    return (
      <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
        <PDAEditor />
        <button 
          onClick={() => setActiveModel(null)} 
          style={{ 
            position: 'absolute', 
            top: 10, 
            left: 10, 
            zIndex: 1000,
            padding: '8px 16px',
            background: '#fff',
            border: '2px solid #ddd',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          ← Voltar
        </button>
      </div>
    )
  }

  // Máquina de Turing Multi-Fita
  if (activeModel === 'MULTI_TM') {
    return (
      <div style={{ height: '100vh', width: '100vw' }}>
        <MultiTapeTMEditor />
        <button onClick={() => setActiveModel(null)} style={{ position: 'absolute', top: 10, left: 10 }}>← Voltar</button>
      </div>
    )
  }

  // Máquina de Turing com Blocos
  if (activeModel === 'TM_BLOCKS') {
    return (
      <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
        <TMBlocksEditor />
        <button 
          onClick={() => setActiveModel(null)} 
          style={{ 
            position: 'absolute', 
            top: 10, 
            left: 10, 
            zIndex: 1000,
            padding: '8px 16px',
            background: '#fff',
            border: '2px solid #ddd',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          ← Voltar
        </button>
      </div>
    )
  }

  // Placeholder para outros modelos (implementar depois)
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <h2>🚧 Em Desenvolvimento</h2>
      <p>O modelo <strong>{activeModel}</strong> ainda não foi implementado.</p>
      <button 
        onClick={() => setActiveModel(null)}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          borderRadius: '8px',
          border: 'none',
          background: '#667eea',
          color: 'white',
          cursor: 'pointer'
        }}
      >
        ← Voltar ao Menu
      </button>
    </div>
  )
}
