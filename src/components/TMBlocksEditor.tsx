import { useTMBlocksStore, BLOCK } from '@state/tmBlocksStore'
import { useMemo, useRef, useState, useCallback } from 'react'
import MultiInputPanel from './MultiInputPanel'
import { usePrompt } from './PromptModal'

type TransitionKey = string

export default function TMBlocksEditor() {
  const { prompt, PromptComponent } = usePrompt()
  const {
    machine,
    positions,
    selected,
    tempFrom,
    simulation,
    setPositions,
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
    stopSimulation
  } = useTMBlocksStore()

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
      const read = await prompt(`Símbolo a ler (ou ${BLOCK} para branco):`, BLOCK)
      if (read === null) return
      const write = await prompt(`Símbolo a escrever (ou ${BLOCK} para branco):`, BLOCK)
      if (write === null) return
      const moveStr = await prompt('Direção (L=esquerda, R=direita, S=parado):', 'R')
      if (moveStr === null) return

      addTransition({
        from: selected,
        to: id,
        read,
        write,
        move: (moveStr.toUpperCase() === 'L' ? 'L' : moveStr.toUpperCase() === 'S' ? 'S' : 'R')
      })
      return
    }

    if (mode === 'addTransition' && tempFrom) {
      const read = await prompt(`Símbolo a ler (ou ${BLOCK} para branco):`, BLOCK)
      if (read === null) return
      const write = await prompt(`Símbolo a escrever (ou ${BLOCK} para branco):`, BLOCK)
      if (write === null) return
      const moveStr = await prompt('Direção (L=esquerda, R=direita, S=parado):', 'R')
      if (moveStr === null) return

      addTransition({
        from: tempFrom,
        to: id,
        read,
        write,
        move: (moveStr.toUpperCase() === 'L' ? 'L' : moveStr.toUpperCase() === 'S' ? 'S' : 'R')
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
  }, [mode, tempFrom, positions, setSelected, addTransition, setMode, setTempFrom, zoom, pan, selected])

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

  const currentConfig = simulation.isSimulating && simulation.steps[simulation.currentStepIndex]
    ? simulation.steps[simulation.currentStepIndex].config
    : null

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

            {transitions.map(({ from, to, read, write, move, idx }) => {
              const fromPos = positions[from]
              const toPos = positions[to]
              if (!fromPos || !toPos) return null

              const isLoop = from === to
              const key = `${from}→${to}→${idx}`
              const isHovered = hoverTransition === key
              const isEditing = editingTransition === idx

              const label = `${read},${write},${move === 'L' ? '⬅️' : move === 'R' ? '➡️' : '⏸️'}`

              return (
                <TransitionArrow
                  key={key}
                  from={fromPos}
                  to={toPos}
                  label={label}
                  isLoop={isLoop}
                  isHovered={isHovered}
                  isEditing={isEditing}
                  onClick={(e) => onTransitionClick(idx, e)}
                  onMouseEnter={() => setHoverTransition(key)}
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
              const isTempFrom = tempFrom === id
              const isCurrent = currentConfig?.state === id

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
                    fill={isCurrent ? '#ffe58f' : isTempFrom ? '#fff3cd' : isStart ? '#e3f2fd' : '#fff'}
                    stroke={isSelected ? '#0066ff' : isTempFrom ? '#ffc107' : isCurrent ? '#ff6600' : '#333'}
                    strokeWidth={isSelected || isTempFrom || isCurrent ? 3 : 2}
                  />

                  {isAccept && <circle r={20} fill="none" stroke="#333" strokeWidth="2" />}

                  <text textAnchor="middle" dy="5" fontSize="14" fontWeight="bold">{id}</text>
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
            <div>🧱 <strong>Blocos {BLOCK}</strong> representam células vazias</div>
            <div>🖱️ <strong>Duplo-clique</strong>: toggle estado final</div>
            <div>🖱️ <strong>Clique direito</strong>: marcar como inicial</div>
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
        {simulation.isSimulating && currentConfig && (
          <div style={{ padding: 12, borderBottom: '2px solid #ddd', background: '#fff', maxHeight: '30%', overflow: 'auto' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 12 }}>📼 Fita</h4>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              overflow: 'auto',
              padding: 8,
              background: '#f0f0f0',
              border: '2px solid #ff6600',
              borderRadius: 6
            }}>
              {currentConfig.tape.map((symbol, idx) => (
                <div
                  key={idx}
                  style={{
                    minWidth: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: idx === currentConfig.head ? '#ffc107' : '#fff',
                    border: `2px solid ${idx === currentConfig.head ? '#ff6600' : '#ccc'}`,
                    borderRadius: 4,
                    fontWeight: idx === currentConfig.head ? 'bold' : 'normal',
                    fontSize: 16,
                    position: 'relative'
                  }}
                >
                  {symbol}
                  {idx === currentConfig.head && (
                    <div style={{
                      position: 'absolute',
                      top: -20,
                      fontSize: 16
                    }}>
                      ⬇️
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
              <strong>Estado atual:</strong> {currentConfig.state}
            </div>
          </div>
        )}

        <div style={{ padding: 12, borderBottom: '1px solid #ddd', background: '#fff' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 12 }}>▶️ Simulação</h4>
          {!simulation.isSimulating ? (
            <MultiInputPanel
              onSimulate={(inputs) => {
                if (inputs.length === 1) {
                  startSimulation(inputs[0])
                }
              }}
              disabled={simulation.isSimulating}
              placeholder="Entrada (ex: 0011)"
            />
          ) : (
            <>
              <div style={{
                padding: 8,
                background: simulation.accepted ? '#d4edda' : '#fffbe6',
                border: `2px solid ${simulation.accepted ? '#28a745' : '#ffe58f'}`,
                borderRadius: 4,
                marginBottom: 8,
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                {simulation.accepted ? '✅ ACEITO' : '⏸️ EXECUTANDO'}
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
                    cursor: simulation.currentStepIndex === 0 ? 'not-allowed' : 'pointer',
                    fontSize: 11
                  }}
                >
                  ⏮ Anterior
                </button>
                <button
                  onClick={nextStep}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 11
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
                  fontWeight: 'bold',
                  fontSize: 11
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

        <div style={{ padding: 12, overflow: 'auto', flex: 1, background: '#f9f9f9' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 12 }}>🔧 Ferramentas</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            <button
              onClick={() => setMode('select')}
              disabled={mode === 'select'}
              style={{
                padding: '8px 12px',
                background: mode === 'select' ? '#0066ff' : '#fff',
                color: mode === 'select' ? '#fff' : '#333',
                border: '1px solid #ddd',
                borderRadius: 4,
                cursor: mode === 'select' ? 'default' : 'pointer',
                fontWeight: mode === 'select' ? 'bold' : 'normal',
                fontSize: 11
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
                cursor: mode === 'addState' ? 'default' : 'pointer',
                fontWeight: mode === 'addState' ? 'bold' : 'normal',
                fontSize: 11
              }}
            >
              ➕ Adicionar Estado
            </button>
          </div>

          <h4 style={{ margin: '0 0 6px 0', fontSize: 12 }}>🧱 MT com Blocos</h4>
          <div style={{
            fontSize: 10,
            lineHeight: 1.6,
            background: '#fff3cd',
            padding: 6,
            borderRadius: 4,
            border: '2px solid #ffc107',
            marginBottom: 12
          }}>
            <div><strong>Alfabeto:</strong> {machine.alphabet.join(', ')}</div>
            <div><strong>Fita:</strong> {machine.tapeAlphabet.join(', ')}</div>
            <div><strong>Branco:</strong> {BLOCK} (bloco)</div>
            <div><strong>Início:</strong> {machine.start || '—'}</div>
            <div><strong>Finais:</strong> {machine.accept.length > 0 ? machine.accept.join(', ') : '—'}</div>
          </div>

          {selected && (
            <div style={{ borderTop: '1px solid #ddd', paddingTop: 12 }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: 12 }}>⚙️ Estado: {selected}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button
                  onClick={() => setStart(selected)}
                  style={{ padding: '5px', fontSize: 11, cursor: 'pointer' }}
                >
                  🚀 Definir Inicial
                </button>
                <button
                  onClick={() => toggleAccept(selected)}
                  style={{ padding: '5px', fontSize: 11, cursor: 'pointer' }}
                >
                  {machine.accept.includes(selected) ? '⭕ Remover Final' : '✅ Marcar Final'}
                </button>
                <button
                  onClick={() => { setMode('addTransition'); setTempFrom(selected); }}
                  style={{ padding: '5px', fontSize: 11, cursor: 'pointer' }}
                >
                  → Criar Transição
                </button>
                <button
                  onClick={() => { removeState(selected); setSelected(null); }}
                  style={{ padding: '5px', fontSize: 11, cursor: 'pointer', color: 'red' }}
                >
                  🗑️ Remover
                </button>
              </div>
            </div>
          )}

          {editingTransition !== null && (
            <div style={{ borderTop: '1px solid #ddd', paddingTop: 12 }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: 12 }}>✏️ Transição</h4>
              {(() => {
                const t = machine.transitions[editingTransition]
                return (
                  <div style={{ fontSize: 10, marginBottom: 6, background: '#f0f0f0', padding: 6, borderRadius: 4 }}>
                    <div><strong>De:</strong> {t.from} <strong>Para:</strong> {t.to}</div>
                    <div><strong>Ler:</strong> {t.read}</div>
                    <div><strong>Escrever:</strong> {t.write}</div>
                    <div><strong>Mover:</strong> {t.move === 'L' ? '⬅️ Esquerda' : t.move === 'R' ? '➡️ Direita' : '⏸️ Parado'}</div>
                  </div>
                )
              })()}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button
                  onClick={() => {
                    removeTransition(editingTransition!)
                    setEditingTransition(null)
                  }}
                  style={{ padding: '5px', fontSize: 11, cursor: 'pointer', color: 'red' }}
                >
                  🗑️ Remover
                </button>
                <button
                  onClick={() => setEditingTransition(null)}
                  style={{ padding: '5px', fontSize: 11, cursor: 'pointer' }}
                >
                  ✖️ Cancelar
                </button>
              </div>
            </div>
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
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  if (!from || !to) return null

  if (isLoop) {
    const cx = from.x
    const cy = from.y - 45
    const r = 22
    return (
      <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
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
    <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
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
