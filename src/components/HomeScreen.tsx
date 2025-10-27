import { MODEL_CATALOG, ModelType } from '../types/models'

interface HomeScreenProps {
  onSelectModel: (type: ModelType) => void
}

export default function HomeScreen({ onSelectModel }: HomeScreenProps) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#2d3748',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem 1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Marca d'água de fundo */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.03,
        pointerEvents: 'none',
        zIndex: 0
      }}>
        <img 
          src="/phflap-logo.svg" 
          alt="PHFlap Watermark" 
          style={{ 
            width: '800px', 
            height: '800px',
            filter: 'invert(1)'
          }} 
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      </div>

      {/* Conteúdo principal */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', color: '#e2e8f0' }}>
          {/* Logo */}
          <img 
            src="/phflap-logo.svg" 
            alt="PHFlap Logo" 
            style={{ 
              width: '150px', 
              height: '150px', 
              marginBottom: '1rem',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))'
            }} 
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        <p style={{ fontSize: '1rem', opacity: 0.9, margin: '0.25rem 0' }}>
          Editor e Simulador de Modelos Computacionais
        </p>
        <p style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '0.25rem' }}>
          Alternativa ao JFLAP • Multiplataforma • Open Source
        </p>
      </div>

      {/* Grid de modelos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        maxWidth: '1100px',
        width: '100%'
      }}>
        {MODEL_CATALOG.map(model => (
          <button
            key={model.type}
            onClick={() => onSelectModel(model.type)}
            style={{
              background: '#1a202c',
              border: '1px solid #4a5568',
              borderRadius: '8px',
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.borderColor = '#667eea'
              e.currentTarget.style.background = '#252d3d'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = '#4a5568'
              e.currentTarget.style.background = '#1a202c'
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>
              {model.icon}
            </div>
            <h3 style={{ 
              margin: 0, 
              fontSize: '1.1rem', 
              color: '#e2e8f0',
              fontWeight: '600'
            }}>
              {model.name}
            </h3>
            <p style={{ 
              margin: 0, 
              fontSize: '0.85rem', 
              color: '#a0aec0',
              lineHeight: '1.3'
            }}>
              {model.description}
            </p>
            <div style={{
              marginTop: '0.25rem',
              display: 'inline-block',
              padding: '0.2rem 0.6rem',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: '500',
              background: getCategoryColor(model.category),
              color: 'white',
              alignSelf: 'flex-start'
            }}>
              {getCategoryLabel(model.category)}
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '2.5rem',
        textAlign: 'center',
        color: '#a0aec0',
        fontSize: '0.85rem'
      }}>
        <p>v1.0.0 • Desenvolvido por Phenriquess25 (phss22@ic.ufal.br) @ UFAL</p>
        <p style={{ marginTop: '0.5rem' }}>
          <a href="https://github.com/Phenriquess25/PHFlap" style={{ color: '#667eea', textDecoration: 'none' }}>
            GitHub
          </a>
          {' • '}
          <a href="https://github.com/Phenriquess25/PHFlap#readme" style={{ color: '#667eea', textDecoration: 'none' }}>
            Documentação
          </a>
        </p>
      </div>
      </div> {/* Fecha div do conteúdo principal */}
    </div>
  )
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'automaton': return '#3b82f6'
    case 'transducer': return '#8b5cf6'
    case 'grammar': return '#10b981'
    case 'formal': return '#f59e0b'
    default: return '#6b7280'
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'automaton': return 'AUTÔMATO'
    case 'transducer': return 'TRANSDUTOR'
    case 'grammar': return 'GRAMÁTICA'
    case 'formal': return 'FORMAL'
    default: return 'OUTRO'
  }
}
