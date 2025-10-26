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
import { ModelType } from './types/models'

export default function App() {
  const [activeModel, setActiveModel] = useState<ModelType | null>('FA') // Inicia direto no FA

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
