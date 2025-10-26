import { useTMStore } from '@state/tmStore'
import TMEditor from './TMEditor'

interface TMScreenProps {
  onBack: () => void
}

export default function TMScreen({ onBack }: TMScreenProps) {
  const { tm, createNewTM } = useTMStore()
  
  // Inicializar TM se não existe
  if (!tm) {
    createNewTM()
    return <div>Inicializando...</div>
  }
  
  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
      <TMEditor />
      <button 
        onClick={onBack} 
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
