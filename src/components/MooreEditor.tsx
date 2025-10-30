import { useMooreStore } from '@state/mooreStore'
import { useMemo, useRef, useState, useCallback } from 'react'
import MultiInputPanel from './MultiInputPanel'
import { usePrompt } from './PromptModal'

type TransitionKey = string

export default function MooreEditor() {
  const { prompt, PromptComponent } = usePrompt()
  const {
    machine,
    positions,
    mode,
    selected,
    tempFrom,
    simulation,
    setMode,
    setSelected,
    addState,
    removeState,
    setPositions,
    setStart,
    setOutput,
    setMachine,
    beginTransition,
    addTransition,
    removeTransition,
    startSimulation,
    nextStep,
    prevStep,
    resetSimulation,
    stopSimulation
  } = useMooreStore()

  const svgRef = useRef<SVGSVGElement | null>(null)
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null)
  const [editingTransition, setEditingTransition] = useState<{ from: string; to: string; input: string } | null>(null)
  const [hoverState, setHoverState] = useState<string | null>(null)
  const [hoverTransition, setHoverTransition] = useState<TransitionKey | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  const transitions = useMemo(() => {
    return machine.transitions.map((t, idx) => ({ ...t, key: `${t.from}→${t.to}→${idx}` }))
  }, [machine.transitions])

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
  }, [mode, addState, setMode, setSelected, zoom, pan])

  const onStateMouseDown = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Atalho: Ctrl+clique para criar transição
    if (e.ctrlKey && selected && selected !== id) {
      const input = await prompt('Símbolos de entrada (separados por vírgula):')
      if (input !== null && input.trim()) {
        addTransition({ from: selected, to: id, input })
      }
      return
    }
    
    if (mode === 'addTransition' && tempFrom) {
      const input = await prompt('Símbolos de entrada (separados por vírgula):')
      if (input !== null && input.trim()) {
        addTransition({ from: tempFrom, to: id, input })
      }
      setMode('select')
      return
    }
    
    setSelected(id)
    const pos = positions[id]
    if (pos) {
      setDrag({ id, dx: e.clientX - pos.x * zoom - pan.x, dy: e.clientY - pos.y * zoom - pan.y })
    }
  }, [mode, tempFrom, positions, setSelected, addTransition, setMode, zoom, pan, selected])

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
      setPositions({ ...positions, [drag.id]: { x, y } })
    }
  }, [drag, positions, setPositions, zoom, pan, isPanning, panStart])

  const onMouseUp = useCallback(() => {
    setDrag(null)
    setIsPanning(false)
  }, [])

  const onStateDoubleClick = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setStart(id)
  }, [setStart])

  const onStateRightClick = useCallback(async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const output = await prompt(`Definir saída para ${id}:`, machine.outputs[id] || '')
    if (output !== null) {
      setOutput(id, output)
    }
  }, [setOutput, machine.outputs, prompt])

  const onTransitionClick = useCallback((t: typeof transitions[0], e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTransition({ from: t.from, to: t.to, input: t.input })
  }, [])

  const onTransitionDoubleClick = useCallback(async (t: typeof transitions[0], e: React.MouseEvent) => {
    e.stopPropagation()
    const newInput = await prompt('Editar símbolo da transição:', t.input)
    if (newInput !== null && newInput.trim()) {
      // Remover transição antiga
      removeTransition(transitions.findIndex(tr => tr.from === t.from && tr.to === t.to && tr.input === t.input))
      // Adicionar nova transição
      addTransition({ from: t.from, to: t.to, input: newInput.trim() })
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

  // Função para salvar máquina de Moore
  const handleSave = useCallback(() => {
    const data = {
      machine: machine,
      positions: positions,
      version: '1.0.0',
      type: 'MOORE',
      timestamp: new Date().toISOString()
    }
    
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `moore-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [machine, positions])

  // Função para carregar máquina de Moore
  const handleLoad = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string)
          if (data.machine && data.positions) {
            setMachine(data.machine)
            setPositions(data.positions)
            setSelected(null)
            setMode('select')
            stopSimulation()
          }
        } catch (error) {
          alert('Erro ao carregar arquivo: formato inválido')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [setMachine, setPositions, setSelected, setMode, stopSimulation])

  const isActive = (stateId: string) => {
    if (!simulation.isSimulating) return false
    const currentStep = simulation.steps[simulation.currentStepIndex]
    return currentStep?.state === stateId
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

            {/* Agrupar loops por estado e desenhar uma única seta com múltiplos rótulos */}
            {machine.states.map(stateId => {
              const loopTransitions = transitions.filter(t => t.from === stateId && t.to === stateId)
              
              const pos = positions[stateId]
              if (!pos) return null
              
              return loopTransitions.length > 0 && (() => {
                const isAnyEditing = loopTransitions.some(t => 
                  editingTransition?.from === t.from && 
                  editingTransition?.to === t.to && 
                  editingTransition?.input === t.input
                )
                const isAnyHovered = loopTransitions.some(t => hoverTransition === t.key)

                const strokeColor = isAnyEditing
                  ? '#ff6600'
                  : isAnyHovered
                  ? '#0066ff'
                  : '#666'

                const cx = pos.x
                const cy = pos.y - 45
                const r = 22

                return (
                  <g
                    key={`loop-${stateId}`}
                    onClick={(e) => { e.stopPropagation(); onTransitionClick(loopTransitions[0], e); }}
                    onDoubleClick={(e) => { e.stopPropagation(); onTransitionDoubleClick(loopTransitions[0], e); }}
                    onMouseEnter={() => setHoverTransition(loopTransitions[0].key)}
                    onMouseLeave={() => setHoverTransition(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* círculo transparente maior para área de clique */}
                    <circle cx={cx} cy={cy} r={r + 5} fill="transparent" stroke="transparent" strokeWidth="10" />
                    
                    {/* único arco */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isAnyEditing ? 3 : isAnyHovered ? 2.5 : 2}
                      markerEnd="url(#arrowhead)"
                    />

                    {/* textos empilhados acima com caixas brancas */}
                    {loopTransitions.map((t, idx) => {
                      const label = t.input
                      const labelOffsetY = idx * 20 // cada texto sobe 20px a mais
                      const isThisEditing = editingTransition?.from === t.from && 
                                           editingTransition?.to === t.to && 
                                           editingTransition?.input === t.input
                      const isThisHovered = hoverTransition === t.key
                      
                      return (
                        <g key={t.key}>
                          {/* caixa branca de fundo */}
                          <rect
                            x={cx - label.length * 4.5}
                            y={cy - r - 25 - labelOffsetY}
                            width={label.length * 9}
                            height={20}
                            fill="rgba(255, 255, 255, 0.9)"
                            stroke={
                              isThisEditing
                                ? '#ff6600'
                                : isThisHovered
                                ? '#0066ff'
                                : '#ddd'
                            }
                            strokeWidth="1"
                            rx="3"
                          />
                          {/* texto */}
                          <text
                            x={cx}
                            y={cy - r - 11 - labelOffsetY}
                            textAnchor="middle"
                            fontSize="16"
                            fill={isThisEditing ? '#ff6600' : '#222'}
                            fontWeight="bold"
                          >
                            {label}
                          </text>
                        </g>
                      )
                    })}
                  </g>
                )
              })()
            })}

            {/* Desenhar transições normais (não-loops) */}
            {transitions.filter(t => t.from !== t.to).map((t) => {
              const isHovered = hoverTransition === t.key
              const isEditing = editingTransition?.from === t.from && editingTransition?.to === t.to && editingTransition?.input === t.input
              
              return (
                <TransitionArrow
                  key={t.key}
                  from={positions[t.from]}
                  to={positions[t.to]}
                  label={t.input}
                  isLoop={t.from === t.to}
                  isHovered={isHovered}
                  isEditing={isEditing}
                  onClick={(e) => onTransitionClick(t, e)}
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
              const active = isActive(id)
              const isTempFrom = tempFrom === id
              const output = machine.outputs[id] || ''

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
                  
                  <text textAnchor="middle" dy="5" fontSize="14" fontWeight="bold" fill="#333">{id}</text>
                  
                  {output && (
                    <g>
                      <rect
                        x={-output.length * 4.5}
                        y={30}
                        width={output.length * 9}
                        height={20}
                        fill="rgba(255, 255, 255, 0.9)"
                        stroke="#222"
                        strokeWidth="1"
                        rx="3"
                      />
                      <text
                        x="0"
                        y="44"
                        textAnchor="middle"
                        fontSize="16"
                        fill="#222"
                        fontWeight="bold"
                      >
                        {output}
                      </text>
                    </g>
                  )}
                  
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
            <div>🖱️ <strong>Clique direito</strong> em estado: definir saída</div>
            <div>🖱️ <strong>Clique</strong> em transição: editar rótulo (entrada)</div>
            <div>⚙️ <strong>Botão vermelho (×)</strong>: remover estado/transição</div>
            <div>🎯 <strong>Roda do mouse</strong>: zoom in/out</div>
            <div>🖱️ <strong>Botão do meio</strong>: arrastar tela (pan)</div>
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
        {/* Painel de Saída */}
        {simulation.isSimulating && (
          <div style={{ padding: 12, borderBottom: '2px solid #ddd', background: '#fff' }}>
            <h4 style={{ margin: '0 0 8px 0' }}>📤 Saída</h4>
            <div style={{
              minHeight: 60,
              padding: 12,
              background: '#2d3748',
              border: '2px solid #4caf50',
              borderRadius: 6,
              fontFamily: 'monospace',
              fontSize: 16,
              color: '#10B981',
              fontWeight: 'bold'
            }}>
              {simulation.outputSequence.join(' ') || '(vazio)'}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              {(() => {
                const currentStep = simulation.steps[simulation.currentStepIndex]
                return (
                  <>
                    <div><strong>Estado atual:</strong> {currentStep?.state || 'N/A'}</div>
                    <div><strong>Entrada restante:</strong> {currentStep?.remainingInput || '(vazio)'}</div>
                  </>
                )
              })()}
            </div>
          </div>
        )}

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
            </>
          )}
        </div>
        
        <div style={{ padding: 12, overflow: 'auto', background: '#f9f9f9', flex: 1 }}>
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

          <h4 style={{ margin: '0 0 6px 0', fontSize: 12 }}>💾 Arquivo</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
            <button
              onClick={handleSave}
              style={{
                padding: '6px 8px',
                fontSize: 11,
                cursor: 'pointer',
                background: '#4caf50',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                fontWeight: 'bold'
              }}
            >
              💾 Salvar Máquina
            </button>
            <button
              onClick={handleLoad}
              style={{
                padding: '6px 8px',
                fontSize: 11,
                cursor: 'pointer',
                background: '#2196f3',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                fontWeight: 'bold'
              }}
            >
              📂 Carregar Máquina
            </button>
          </div>

          <h4 style={{ margin: '0 0 8px 0' }}>🎯 Máquina de Moore</h4>
          <div style={{ 
            fontSize: 12, 
            lineHeight: 1.6, 
            background: '#e8f5e9',
            padding: 8,
            borderRadius: 4,
            border: '2px solid #4caf50'
          }}>
            <div><strong>Alfabeto Entrada:</strong> {machine.alphabet.join(', ')}</div>
            <div><strong>Alfabeto Saída:</strong> {machine.outputAlphabet.join(', ')}</div>
            <div><strong>Início:</strong> {machine.start || '—'}</div>
            <div style={{ marginTop: 6, fontSize: 11, color: '#2e7d32', fontStyle: 'italic' }}>
              💡 Saídas nos estados (abaixo em verde)
            </div>
            <div style={{ marginTop: 4, fontSize: 11, color: '#2e7d32', fontStyle: 'italic' }}>
              💡 Ctrl+Click para criar transições
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
                  onClick={async () => {
                    const output = await prompt(`Definir saída para ${selected}:`, machine.outputs[selected] || '')
                    if (output !== null) {
                      setOutput(selected, output)
                    }
                  }}
                  style={{ padding: '6px', fontSize: 12, cursor: 'pointer', background: '#fff', border: '1px solid #ddd', borderRadius: 4 }}
                >
                  📤 Definir Saída
                </button>
                <button
                  onClick={() => {
                    console.log('🔘 MooreEditor - Botão Criar Transição clicado', { selected, tempFrom, mode })
                    beginTransition(selected)
                    console.log('🔘 MooreEditor - beginTransition chamado')
                  }}
                  style={{ padding: '6px', fontSize: 12, cursor: 'pointer', background: '#fff', border: '1px solid #ddd', borderRadius: 4 }}
                >
                  → Criar Transição
                </button>
                <button
                  onClick={() => { removeState(selected); setSelected(null); }}
                  style={{ padding: '6px', fontSize: 12, cursor: 'pointer', color: 'red', borderColor: 'red', background: '#fff', border: '1px solid red', borderRadius: 4 }}
                >
                  🗑️ Remover Estado
                </button>
              </div>
            </>
          )}

          {editingTransition && (
            <>
              <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #ddd' }} />
              <h4 style={{ margin: '0 0 8px 0' }}>✏️ Transição</h4>
              <div style={{ fontSize: 12, marginBottom: 8, background: '#f0f0f0', padding: 8, borderRadius: 4 }}>
                <div><strong>De:</strong> {editingTransition.from}</div>
                <div><strong>Para:</strong> {editingTransition.to}</div>
                <div><strong>Input:</strong> {editingTransition.input}</div>
              </div>
              <button
                onClick={() => {
                  if (window.confirm(`Remover transição?`)) {
                    const idx = machine.transitions.findIndex(
                      t => t.from === editingTransition.from && 
                           t.to === editingTransition.to && 
                           t.input === editingTransition.input
                    )
                    if (idx >= 0) {
                      removeTransition(idx)
                    }
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
