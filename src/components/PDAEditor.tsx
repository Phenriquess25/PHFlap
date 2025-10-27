import { usePDAStore } from '@state/pdaStore'
import { useMemo, useRef, useState, useCallback } from 'react'
import MultiInputPanel from './MultiInputPanel'
import { usePrompt } from './PromptModal'

type TransitionKey = string

export default function PDAEditor() {
  const { prompt, PromptComponent } = usePrompt()
  const {
    machine,
    positions,
    selected,
    tempFrom,
    simulation,
    setSelected,
    setTempFrom,
    addState,
    removeState,
    setStart,
    toggleAccept,
    addTransition,
    removeTransition,
    startSimulation,
    nextStep,
    prevStep,
    resetSimulation,
    stopSimulation
  } = usePDAStore()

  const svgRef = useRef<SVGSVGElement | null>(null)
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null)
  const [mode, setMode] = useState<'select' | 'addState' | 'addTransition'>('select')
  const [editingTransition, setEditingTransition] = useState<number | null>(null)
  const [hoverState, setHoverState] = useState<string | null>(null)
  const [hoverTransition, setHoverTransition] = useState<TransitionKey | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  const transitions = useMemo(() => {
    return machine.transitions.map((t, idx) => ({ ...t, key: `${t.from}→${t.to}→${idx}`, idx }))
  }, [machine.transitions])

  const currentStep = simulation.steps[simulation.currentStepIndex]
  const currentStack = currentStep?.config.stack || []

  const onCanvasClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as Element
    if (target !== svgRef.current && !target.hasAttribute('data-background')) return
    
    const rect = svgRef.current!.getBoundingClientRect()
    const rawX = (e.clientX - rect.left - pan.x) / zoom
    const rawY = (e.clientY - rect.top - pan.y) / zoom
    
    if (mode === 'addState' || e.shiftKey) {
      const x = Math.round(rawX / 20) * 20
      const y = Math.round(rawY / 20) * 20
      addState({ x, y })
      setMode('select')
    } else {
      setSelected(null)
      setEditingTransition(null)
    }
  }, [mode, addState, setSelected, zoom, pan])

  const onStateMouseDown = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Atalho: Ctrl+clique para criar transição
    if (e.ctrlKey && selected && selected !== id) {
      const input = await prompt('Símbolo de entrada (ou ε para vazio):')
      if (input === null) return
      const stackPop = await prompt('Símbolo a desempilhar (ou ε para nada):')
      if (stackPop === null) return
      const stackPush = await prompt('Símbolo(s) a empilhar (ou ε para nada):')
      if (stackPush === null) return
      
      addTransition({
        from: selected,
        to: id,
        input: input === 'e' ? 'ε' : input,
        stackPop: stackPop === 'e' ? 'ε' : stackPop,
        stackPush: stackPush === 'e' ? 'ε' : stackPush
      })
      return
    }
    
    if (mode === 'addTransition' && tempFrom) {
      const input = await prompt('Símbolo de entrada (ou ε para vazio):')
      if (input === null) return
      const stackPop = await prompt('Símbolo a desempilhar (ou ε para nada):')
      if (stackPop === null) return
      const stackPush = await prompt('Símbolo(s) a empilhar (ou ε para nada):')
      if (stackPush === null) return
      
      addTransition({
        from: tempFrom,
        to: id,
        input: input === 'e' ? 'ε' : input,
        stackPop: stackPop === 'e' ? 'ε' : stackPop,
        stackPush: stackPush === 'e' ? 'ε' : stackPush
      })
      setMode('select')
      setTempFrom(null)
      return
    }
    
    setSelected(id)
    const pos = positions[id]
    if (pos) {
      setDrag({ id, dx: e.clientX - pos.x * zoom - pan.x, dy: e.clientY - pos.y * zoom - pan.y })
    }
  }, [mode, tempFrom, positions, setSelected, addTransition, setTempFrom, zoom, pan, selected, setMode])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    } else if (drag) {
      const rect = svgRef.current!.getBoundingClientRect()
      const rawX = (e.clientX - rect.left - pan.x) / zoom
      const rawY = (e.clientY - rect.top - pan.y) / zoom
      const x = Math.round(rawX / 20) * 20
      const y = Math.round(rawY / 20) * 20
      usePDAStore.setState((s) => ({
        positions: { ...s.positions, [drag.id]: { x, y } }
      }))
    }
  }, [drag, zoom, pan, isPanning, panStart])

  const onMouseUp = useCallback(() => {
    setDrag(null)
    setIsPanning(false)
  }, [])

  const onStateDoubleClick = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    toggleAccept(id)
  }, [toggleAccept])

  const onStateRightClick = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setStart(id)
  }, [setStart])

  const onTransitionClick = useCallback((idx: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTransition(idx)
  }, [])

  const onTransitionDoubleClick = useCallback(async (t: typeof transitions[0], e: React.MouseEvent) => {
    e.stopPropagation()
    const newInput = await prompt('Editar símbolo de entrada:', t.input)
    if (newInput === null) return
    
    const newStackPop = await prompt('Editar símbolo a desempilhar:', t.stackPop)
    if (newStackPop === null) return
    
    const newStackPush = await prompt('Editar símbolos a empilhar:', t.stackPush)
    if (newStackPush === null) return
    
    if (newInput.trim() && newStackPop.trim() && newStackPush.trim()) {
      removeTransition(transitions.findIndex(tr => 
        tr.from === t.from && tr.to === t.to && 
        tr.input === t.input && tr.stackPop === t.stackPop && tr.stackPush === t.stackPush
      ))
      addTransition({ 
        from: t.from, 
        to: t.to, 
        input: newInput.trim(), 
        stackPop: newStackPop.trim(), 
        stackPush: newStackPush.trim() 
      })
      setEditingTransition(null)
    }
  }, [transitions, removeTransition, addTransition, prompt])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(z => Math.max(0.3, Math.min(3, z * delta)))
  }, [])

  const onMiddleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }, [pan])

  const isActive = (stateId: string) => {
    if (!simulation.isSimulating) return false
    return currentStep?.config.state === stateId
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', height: '100vh', overflow: 'hidden' }}>
      <div style={{ position: 'relative', background: '#fafafa', borderRight: '1px solid #ddd', overflow: 'hidden' }}>
        <svg
          ref={svgRef}
          onClick={onCanvasClick}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseDown={onMiddleMouseDown}
          onWheel={onWheel}
          style={{ 
            width: '100%', 
            height: '100%', 
            cursor: mode === 'addState' ? 'crosshair' : isPanning ? 'grabbing' : 'default' 
          }}
        >
          <defs>
            <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e8e8e8" strokeWidth="0.5"/>
            </pattern>
            <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="url(#smallGrid)"/>
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#d0d0d0" strokeWidth="1"/>
            </pattern>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#333" />
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" data-background="true" />

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {machine.start && positions[machine.start] && (
              <g>
                <line
                  x1={positions[machine.start].x - 50}
                  y1={positions[machine.start].y}
                  x2={positions[machine.start].x - 28}
                  y2={positions[machine.start].y}
                  stroke="#666"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                <text x={positions[machine.start].x - 75} y={positions[machine.start].y + 5} fontSize="12" fill="#666">Start</text>
              </g>
            )}

            {transitions.map((t) => {
              const isHovered = hoverTransition === t.key
              const isEditing = editingTransition === t.idx
              
              return (
                <TransitionArrow
                  key={t.key}
                  from={positions[t.from]}
                  to={positions[t.to]}
                  label={`${t.input}, ${t.stackPop} → ${t.stackPush}`}
                  isLoop={t.from === t.to}
                  isHovered={isHovered}
                  isEditing={isEditing}
                  onClick={(e) => onTransitionClick(t.idx, e)}
                  onDoubleClick={(e) => onTransitionDoubleClick(t, e)}
                  onMouseEnter={() => setHoverTransition(t.key)}
                  onMouseLeave={() => setHoverTransition(null)}
                />
              )
            })}

            {machine.states.map(id => {
              const pos = positions[id]
              if (!pos) return null
              const isSelected = id === selected
              const isHovered = hoverState === id
              const isStart = machine.start === id
              const isAccept = machine.accept.includes(id)
              const active = isActive(id)
              const isTempFrom = tempFrom === id

              return (
                <g
                  key={id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onMouseDown={(e) => onStateMouseDown(id, e)}
                  onDoubleClick={(e) => onStateDoubleClick(id, e)}
                  onContextMenu={(e) => onStateRightClick(id, e)}
                  onMouseEnter={() => setHoverState(id)}
                  onMouseLeave={() => setHoverState(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {(isSelected || isHovered) && (
                    <circle
                      r={30}
                      fill="none"
                      stroke={isSelected ? '#0066ff' : '#66b3ff'}
                      strokeWidth="2"
                      opacity="0.5"
                    />
                  )}
                  
                  {isTempFrom && mode === 'addTransition' && (
                    <>
                      <circle
                        r={28}
                        fill="none"
                        stroke="#ffc107"
                        strokeWidth="3"
                        strokeDasharray="5,5"
                      >
                        <animate attributeName="stroke-dashoffset" from="0" to="10" dur="1s" repeatCount="indefinite" />
                      </circle>
                      <text x="0" y="-40" textAnchor="middle" fontSize="11" fill="#ff6600" fontWeight="bold">
                        👆 Clique no destino
                      </text>
                    </>
                  )}
                  
                  <circle
                    r={24}
                    fill={isTempFrom ? '#fff3cd' : active ? '#66b3ff' : isStart ? '#e3f2fd' : '#fff'}
                    stroke={isSelected ? '#0066ff' : isTempFrom ? '#ffc107' : active ? '#0066ff' : '#333'}
                    strokeWidth={isSelected || isTempFrom || active ? 3 : 2}
                  />
                  
                  {isAccept && <circle r={20} fill="none" stroke="#333" strokeWidth="2" />}
                  
                  <text textAnchor="middle" dy="5" fontSize="14" fontWeight="bold" fill="#333">{id}</text>
                  
                  {!simulation.isSimulating && (
                    <g
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm(`Remover estado ${id}?`)) {
                          removeState(id)
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle cx="18" cy="-18" r="8" fill="#E53E3E" />
                      <text x="18" y="-14" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">×</text>
                    </g>
                  )}
                </g>
              )
            })}
          </g>
        </svg>

        <div style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          background: 'rgba(255,255,255,0.95)',
          padding: '8px 12px',
          borderRadius: 6,
          fontSize: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          border: '1px solid #ddd'
        }}>
          <div><strong>Modo:</strong> {
            mode === 'select' ? '🖱️ Selecionar' :
            mode === 'addState' ? '➕ Adicionar Estado' :
            `→ Criar Transição${tempFrom ? ` (de ${tempFrom})` : ''}`
          }</div>
          <div><strong>Estados:</strong> {machine.states.length} | <strong>Transições:</strong> {transitions.length}</div>
          <div><strong>Zoom:</strong> {(zoom * 100).toFixed(0)}%</div>
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #e0e0e0', fontSize: 11, color: '#666' }}>
            <div>🖱️ <strong>Duplo-clique</strong> em estado: marcar como inicial</div>
            <div>🖱️ <strong>Clique</strong> em transição: editar entrada/pop/push</div>
            <div>⚙️ <strong>Botão vermelho (×)</strong>: remover estado/transição</div>
            <div>🎯 <strong>Roda do mouse</strong>: zoom in/out</div>
            <div>🖱️ <strong>Botão do meio</strong>: arrastar tela (pan)</div>
            <div>📚 <strong>Pilha</strong> visível durante simulação no painel lateral</div>
          </div>
        </div>

        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}>
          <button
            onClick={() => setZoom(z => Math.min(3, z * 1.2))}
            style={{ padding: '4px 8px', fontSize: 16, cursor: 'pointer', background: '#fff', border: '1px solid #ddd', borderRadius: 4 }}
          >
            +
          </button>
          <button
            onClick={() => setZoom(1)}
            style={{ padding: '4px 8px', fontSize: 10, cursor: 'pointer', background: '#fff', border: '1px solid #ddd', borderRadius: 4 }}
          >
            100%
          </button>
          <button
            onClick={() => setZoom(z => Math.max(0.3, z / 1.2))}
            style={{ padding: '4px 8px', fontSize: 16, cursor: 'pointer', background: '#fff', border: '1px solid #ddd', borderRadius: 4 }}
          >
            −
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#f9f9f9' }}>
        {/* Visualizador de Pilha */}
        <div style={{ padding: 12, borderBottom: '2px solid #ddd', background: '#fff' }}>
          <h4 style={{ margin: '0 0 8px 0' }}>📚 Pilha</h4>
          <div style={{
            minHeight: 120,
            maxHeight: 200,
            overflow: 'auto',
            background: '#f9f9f9',
            border: '2px solid #9c27b0',
            borderRadius: 6,
            padding: 8
          }}>
            {currentStack.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>Pilha vazia</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 4 }}>
                {currentStack.map((symbol, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '6px 12px',
                      background: idx === currentStack.length - 1 ? '#e1bee7' : '#fff',
                      border: '2px solid #9c27b0',
                      borderRadius: 4,
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: 14
                    }}
                  >
                    {symbol}
                    {idx === currentStack.length - 1 && ' ← topo'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Simulador */}
        <div style={{ padding: 12, borderBottom: '1px solid #ddd', background: '#fff' }}>
          <h4 style={{ margin: '0 0 8px 0' }}>▶️ Simulação</h4>
          {!simulation.isSimulating ? (
            <MultiInputPanel
              onSimulate={(inputs) => {
                if (inputs.length === 1) {
                  startSimulation(inputs[0])
                } else {
                  startSimulation(inputs[0])
                }
              }}
              disabled={simulation.isSimulating}
              placeholder="Entrada (ex: aabb)"
            />
          ) : (
            <>
              <div style={{
                padding: 8,
                background: simulation.accepted ? '#d4edda' : '#f8d7da',
                border: `2px solid ${simulation.accepted ? '#28a745' : '#dc3545'}`,
                borderRadius: 4,
                marginBottom: 8,
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                {simulation.accepted ? '✅ ACEITO' : '❌ REJEITADO'}
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <button
                  onClick={prevStep}
                  disabled={simulation.currentStepIndex === 0}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: simulation.currentStepIndex === 0 ? '#ccc' : '#fff',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    cursor: simulation.currentStepIndex === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ⏮ Anterior
                </button>
                <button
                  onClick={resetSimulation}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  🔄 Reset
                </button>
                <button
                  onClick={nextStep}
                  disabled={simulation.currentStepIndex === simulation.steps.length - 1}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: simulation.currentStepIndex === simulation.steps.length - 1 ? '#ccc' : '#fff',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    cursor: simulation.currentStepIndex === simulation.steps.length - 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Próximo ⏭
                </button>
              </div>

              <button
                onClick={stopSimulation}
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ⏹ Parar
              </button>

              <div style={{ marginTop: 8, fontSize: 12 }}>
                <strong>Passo:</strong> {simulation.currentStepIndex + 1} / {simulation.steps.length}
              </div>
              {currentStep && (
                <div style={{ marginTop: 4, fontSize: 11, color: '#666' }}>
                  <div><strong>Estado:</strong> {currentStep.config.state}</div>
                  <div><strong>Entrada restante:</strong> {currentStep.config.remainingInput || 'ε'}</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Ferramentas */}
        <div style={{ padding: 12, overflow: 'auto', flex: 1 }}>
          <h3 style={{ margin: '0 0 12px 0' }}>🔧 Ferramentas</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              onClick={() => setMode('select')}
              disabled={mode === 'select'}
              style={{
                padding: '8px 12px',
                background: mode === 'select' ? '#0066ff' : '#fff',
                color: mode === 'select' ? '#fff' : '#333',
                border: '1px solid #ddd',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: mode === 'select' ? 'bold' : 'normal'
              }}
            >
              🖱️ Selecionar
            </button>
            <button
              onClick={() => setMode('addState')}
              disabled={mode === 'addState'}
              style={{
                padding: '8px 12px',
                background: mode === 'addState' ? '#0066ff' : '#fff',
                color: mode === 'addState' ? '#fff' : '#333',
                border: '1px solid #ddd',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: mode === 'addState' ? 'bold' : 'normal'
              }}
            >
              ➕ Adicionar Estado
            </button>
          </div>

          <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #ddd' }} />

          <h4 style={{ margin: '0 0 8px 0' }}>📚 Autômato com Pilha</h4>
          <div style={{ 
            fontSize: 12, 
            lineHeight: 1.6, 
            background: '#e1bee7',
            padding: 8,
            borderRadius: 4,
            border: '2px solid #9c27b0'
          }}>
            <div><strong>Alfabeto:</strong> {machine.alphabet.join(', ')}</div>
            <div><strong>Pilha:</strong> {machine.stackAlphabet.join(', ')}</div>
            <div><strong>Início:</strong> {machine.start || '—'}</div>
            <div><strong>Finais:</strong> {machine.accept.length > 0 ? machine.accept.join(', ') : '—'}</div>
            <div style={{ marginTop: 6, fontSize: 11, color: '#6a1b9a', fontStyle: 'italic' }}>
              💡 Transições: input, pop → push
            </div>
          </div>

          {selected && (
            <>
              <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #ddd' }} />
              <h4 style={{ margin: '0 0 8px 0' }}>Estado: {selected}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  onClick={() => setStart(selected)}
                  style={{ padding: '6px', fontSize: 12, cursor: 'pointer', background: '#fff', border: '1px solid #ddd', borderRadius: 4 }}
                >
                  🚀 Definir como Inicial
                </button>
                <button
                  onClick={() => toggleAccept(selected)}
                  style={{ padding: '6px', fontSize: 12, cursor: 'pointer', background: '#fff', border: '1px solid #ddd', borderRadius: 4 }}
                >
                  {machine.accept.includes(selected) ? '⭕ Remover Final' : '✅ Marcar Final'}
                </button>
                <button
                  onClick={() => { setMode('addTransition'); setTempFrom(selected); }}
                  style={{ padding: '6px', fontSize: 12, cursor: 'pointer', background: '#fff', border: '1px solid #ddd', borderRadius: 4 }}
                >
                  → Criar Transição
                </button>
                <button
                  onClick={() => { removeState(selected); setSelected(null); }}
                  style={{ padding: '6px', fontSize: 12, cursor: 'pointer', color: 'red', background: '#fff', border: '1px solid red', borderRadius: 4 }}
                >
                  🗑️ Remover Estado
                </button>
              </div>
            </>
          )}

          {editingTransition !== null && (
            <>
              <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #ddd' }} />
              <h4 style={{ margin: '0 0 8px 0' }}>✏️ Transição</h4>
              {(() => {
                const t = machine.transitions[editingTransition]
                return (
                  <div style={{ fontSize: 12, marginBottom: 8, background: '#f0f0f0', padding: 8, borderRadius: 4 }}>
                    <div><strong>De:</strong> {t.from} → {t.to}</div>
                    <div><strong>Input:</strong> {t.input}</div>
                    <div><strong>Pop:</strong> {t.stackPop}</div>
                    <div><strong>Push:</strong> {t.stackPush}</div>
                  </div>
                )
              })()}
              <button
                onClick={() => {
                  if (window.confirm(`Remover transição?`)) {
                    removeTransition(editingTransition)
                    setEditingTransition(null)
                  }
                }}
                style={{ padding: '6px', fontSize: 12, cursor: 'pointer', color: 'red', width: '100%', background: '#fff', border: '1px solid red', borderRadius: 4 }}
              >
                🗑️ Remover
              </button>
            </>
          )}
        </div>
      </div>
      {PromptComponent}
    </div>
  )
}

function TransitionArrow({
  from,
  to,
  label,
  isLoop,
  isHovered,
  isEditing,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
}: {
  from: { x: number; y: number }
  to: { x: number; y: number }
  label: string
  isLoop: boolean
  isHovered: boolean
  isEditing: boolean
  onClick: (e: React.MouseEvent) => void
  onDoubleClick?: (e: React.MouseEvent) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  if (!from || !to) return null

  if (isLoop) {
    const cx = from.x
    const cy = from.y - 45
    const r = 22
    return (
      <g onClick={onClick} onDoubleClick={onDoubleClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
        <circle cx={cx} cy={cy} r={r + 5} fill="transparent" stroke="transparent" strokeWidth="10" />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={isEditing ? '#ff6600' : isHovered ? '#0066ff' : '#666'}
          strokeWidth={isEditing ? 3 : isHovered ? 2.5 : 2}
          markerEnd="url(#arrowhead)"
        />
        <rect
          x={cx - label.length * 4.5}
          y={cy - r - 25}
          width={label.length * 9}
          height={20}
          fill="rgba(255, 255, 255, 0.9)"
          stroke={isEditing ? '#ff6600' : isHovered ? '#0066ff' : '#ddd'}
          strokeWidth="1"
          rx="3"
        />
        <text
          x={cx}
          y={cy - r - 11}
          textAnchor="middle"
          fontSize="16"
          fill={isEditing ? '#ff6600' : '#222'}
          fontWeight="bold"
        >
          {label}
        </text>
      </g>
    )
  }

  const dx = to.x - from.x
  const dy = to.y - from.y
  const dist = Math.hypot(dx, dy) || 1
  const ux = dx / dist
  const uy = dy / dist

  const start = { x: from.x + ux * 26, y: from.y + uy * 26 }
  const end = { x: to.x - ux * 26, y: to.y - uy * 26 }

  const midX = (start.x + end.x) / 2
  const midY = (start.y + end.y) / 2
  const perpX = -uy * 25
  const perpY = ux * 25
  const ctrlX = midX + perpX
  const ctrlY = midY + perpY

  const pathD = `M ${start.x} ${start.y} Q ${ctrlX} ${ctrlY} ${end.x} ${end.y}`

  return (
    <g onClick={onClick} onDoubleClick={onDoubleClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
      <path d={pathD} fill="none" stroke="transparent" strokeWidth="15" />
      <path
        d={pathD}
        fill="none"
        stroke={isEditing ? '#ff6600' : isHovered ? '#0066ff' : '#666'}
        strokeWidth={isEditing ? 3 : isHovered ? 2.5 : 2}
        markerEnd="url(#arrowhead)"
      />
      <rect
        x={ctrlX - label.length * 4.5}
        y={ctrlY - 25}
        width={label.length * 9}
        height={20}
        fill="rgba(255, 255, 255, 0.9)"
        stroke={isEditing ? '#ff6600' : isHovered ? '#0066ff' : '#ddd'}
        strokeWidth="1"
        rx="3"
      />
      <text
        x={ctrlX}
        y={ctrlY - 11}
        textAnchor="middle"
        fontSize="16"
        fill={isEditing ? '#ff6600' : '#222'}
        fontWeight="bold"
      >
        {label}
      </text>
    </g>
  )
}
