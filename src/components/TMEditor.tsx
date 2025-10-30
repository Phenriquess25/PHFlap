import { useTMStore } from '@state/tmStore'
import { useMemo, useRef, useState, useCallback } from 'react'
import { TuringMachine, TMTransition, Direction, BLANK } from '@model/turing'
import { StateId, Position } from '@model/automata'
import MultiInputPanel from './MultiInputPanel'
import { usePrompt } from './PromptModal'

type TransitionKey = string

export default function TMEditor() {
  const { prompt, PromptComponent } = usePrompt()
  const { tm, positions, setTM, setPositions } = useTMStore()
  
  const [selected, setSelected] = useState<StateId | null>(null)
  const [tempFrom, setTempFrom] = useState<StateId | null>(null)
  
  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [tape, setTape] = useState<string[]>([])
  const [headPosition, setHeadPosition] = useState(0)
  const [currentState, setCurrentState] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [steps, setSteps] = useState<any[]>([])
  const [batchResults, setBatchResults] = useState<Array<{input: string, accepted: boolean}> | null>(null)

    if (!tm) {
      return (
        <div style={{ padding: 20 }}>
          <button
            onClick={() => {
              const newTM: TuringMachine = {
                type: 'TM',
                states: ['q0'],
                alphabet: ['0', '1'],
                tapeAlphabet: ['0', '1', 'X', 'Y', BLANK],
                start: 'q0',
                accept: [],
                transitions: []
              }
              setTM(newTM)
              setPositions({ q0: { x: 400, y: 300 } })
            }}
            style={{
              padding: '12px 24px',
              background: '#0066ff',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 'bold'
            }}
          >
            Criar Nova Máquina de Turing
          </button>
        </div>
      )
    }

    const addState = (pos: Position) => {
      const newId = `q${tm.states.length}`
      setTM({ ...tm, states: [...tm.states, newId] })
      setPositions({ ...positions, [newId]: pos })
      setSelected(newId)
    }

    const removeState = (id: StateId) => {
      setTM({
        ...tm,
        states: tm.states.filter(s => s !== id),
        transitions: tm.transitions.filter(t => t.from !== id && t.to !== id),
        accept: tm.accept.filter(a => a !== id),
        start: tm.start === id ? (tm.states[0] ?? '') : tm.start
      })
      const newPos = { ...positions }
      delete newPos[id]
      setPositions(newPos)
      setSelected(null)
    }

    const setStart = (id: StateId) => {
      setTM({ ...tm, start: id })
    }

    const toggleAccept = (id: StateId) => {
      const isAccept = tm.accept.includes(id)
      setTM({
        ...tm,
        accept: isAccept ? tm.accept.filter(a => a !== id) : [...tm.accept, id]
      })
    }

    const addTransition = async (from: StateId, to: StateId) => {
      const read = await prompt('Símbolo a ler (ou _ para branco):')
      if (read === null) return
      const write = await prompt('Símbolo a escrever (ou _ para branco):')
      if (write === null) return
      const moveStr = await prompt('Direção (L=esquerda, R=direita, S=parado):', 'R')
      if (moveStr === null) return
      const move = (moveStr.toUpperCase() === 'L' ? 'L' : moveStr.toUpperCase() === 'S' ? 'S' : 'R') as Direction
      const newT: TMTransition = {
        from,
        to,
        read: read === '_' ? BLANK : read,
        write: write === '_' ? BLANK : write,
        move
      }
      setTM({ ...tm, transitions: [...tm.transitions, newT] })
    }

    const removeTransition = (idx: number) => {
      setTM({ ...tm, transitions: tm.transitions.filter((_, i) => i !== idx) })
    }

    // Simula completamente uma entrada e retorna se foi aceita
    const simulateComplete = (inputString: string): boolean => {
      let currentTape = inputString.split('')
      currentTape.push(BLANK, BLANK, BLANK)
      let head = 0
      let state = tm.start
      const maxSteps = 10000 // limite para evitar loop infinito

      for (let i = 0; i < maxSteps; i++) {
        if (tm.accept.includes(state)) return true
        
        const symbol = currentTape[head] || BLANK
        const transition = tm.transitions.find(t => t.from === state && t.read === symbol)
        
        if (!transition) {
          return tm.accept.includes(state)
        }

        currentTape[head] = transition.write
        
        if (transition.move === 'L') {
          head = Math.max(0, head - 1)
        } else if (transition.move === 'R') {
          head = head + 1
          if (head >= currentTape.length) currentTape.push(BLANK)
        }
        
        state = transition.to
      }

      return tm.accept.includes(state)
    }

    const startSimulation = (inputString: string) => {
      const initTape = inputString.split('')
      setTape([...initTape, BLANK, BLANK, BLANK])
      setHeadPosition(0)
      setCurrentState(tm.start)
      setCurrentStep(0)
      setIsSimulating(true)
      setAccepted(false)
      setSteps([{ state: tm.start, tape: [...initTape], head: 0 }])
    }

    const stepForward = () => {
      const symbol = tape[headPosition] || BLANK
      const transition = tm.transitions.find(t => t.from === currentState && t.read === symbol)
      if (!transition) {
        setAccepted(tm.accept.includes(currentState))
        return
      }
      const newTape = [...tape]
      newTape[headPosition] = transition.write
      let newHead = headPosition
      if (transition.move === 'L') newHead = Math.max(0, headPosition - 1)
      else if (transition.move === 'R') {
        newHead = headPosition + 1
        if (newHead >= newTape.length) newTape.push(BLANK)
      }
      setTape(newTape)
      setHeadPosition(newHead)
      setCurrentState(transition.to)
      setSteps([...steps, { state: transition.to, tape: newTape, head: newHead }])
      setCurrentStep(steps.length)
      if (tm.accept.includes(transition.to)) setAccepted(true)
    }

    const stepBackward = () => {
      if (currentStep > 0) {
        const prevStep = steps[currentStep - 1]
        setTape(prevStep.tape)
        setHeadPosition(prevStep.head)
        setCurrentState(prevStep.state)
        setCurrentStep(currentStep - 1)
      }
    }

    const stopSimulation = () => {
      setIsSimulating(false)
      setSteps([])
      setCurrentStep(0)
    }

  // Função para salvar máquina de Turing
  const handleSave = useCallback(() => {
    const data = {
      machine: tm,
      positions: positions,
      version: '1.0.0',
      type: 'TM',
      timestamp: new Date().toISOString()
    }
    
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `turing-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [tm, positions])

  // Função para carregar máquina de Turing
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
            setTM(data.machine)
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
  }, [setTM, setPositions])

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
      return tm.transitions.map((t, idx) => ({ ...t, key: `${t.from}→${t.to}→${idx}`, idx }))
    }, [tm.transitions])

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
      await addTransition(selected, id)
      return
    }
    
    if (mode === 'addTransition' && tempFrom) {
      await addTransition(tempFrom, id)
      setMode('select')
      setTempFrom(null)
      return
    }
    
    setSelected(id)
    const pos = positions[id]
    if (pos) {
      setDrag({ id, dx: e.clientX - pos.x * zoom - pan.x, dy: e.clientY - pos.y * zoom - pan.y })
    }
  }, [mode, tempFrom, positions, zoom, pan, selected, addTransition, setMode, setTempFrom, setSelected])

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
    const newRead = await prompt('Editar símbolo lido:', t.read)
    if (newRead === null) return
    
    const newWrite = await prompt('Editar símbolo escrito:', t.write)
    if (newWrite === null) return
    
    const newMove = await prompt('Editar movimento (L/R/S):', t.move)
    if (newMove === null) return
    
    const normalizedMove = newMove.trim().toUpperCase()
    if (newRead.trim() && newWrite.trim() && ['L', 'R', 'S'].includes(normalizedMove)) {
      const updatedTM = { ...tm }
      updatedTM.transitions = [...tm.transitions]
      const idx = transitions.findIndex(tr => 
        tr.from === t.from && tr.to === t.to && 
        tr.read === t.read && tr.write === t.write && tr.move === t.move
      )
      updatedTM.transitions.splice(idx, 1)
      updatedTM.transitions.push({ 
        from: t.from, 
        to: t.to, 
        read: newRead.trim(), 
        write: newWrite.trim(), 
        move: normalizedMove as Direction
      })
      setTM(updatedTM)
      setEditingTransition(null)
    }
  }, [tm, transitions, setTM, prompt])

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

  // (no-op) active helper removed — highlighting uses local 'active' variable per state

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
              {tm.start && positions[tm.start] && (
              <g>
                <line
                    x1={positions[tm.start].x - 50}
                    y1={positions[tm.start].y}
                    x2={positions[tm.start].x - 28}
                    y2={positions[tm.start].y}
                  stroke="#666"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                  <text x={positions[tm.start].x - 75} y={positions[tm.start].y + 5} fontSize="12" fill="#666">Start</text>
              </g>
            )}

            {/* Agrupar loops por estado e desenhar uma única seta com múltiplos rótulos */}
            {tm.states.map(stateId => {
              const loopTransitions = transitions.filter(t => t.from === stateId && t.to === stateId)
              
              const pos = positions[stateId]
              if (!pos) return null
              
              return loopTransitions.length > 0 && (() => {
                const isAnyEditing = loopTransitions.some(t => editingTransition === t.idx)
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
                    onClick={(e) => { e.stopPropagation(); onTransitionClick(loopTransitions[0].idx, e); }}
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
                      const moveArrow = t.move === 'L' ? '←' : t.move === 'R' ? '→' : '•'
                      const label = `${t.read || 'λ'}→${t.write || 'λ'},${moveArrow}`
                      const labelOffsetY = idx * 20 // cada texto sobe 20px a mais
                      
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
                              editingTransition === t.idx
                                ? '#ff6600'
                                : hoverTransition === t.key
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
                            fill={editingTransition === t.idx ? '#ff6600' : '#222'}
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
              const isEditing = editingTransition === t.idx
                const moveArrow = t.move === 'L' ? '←' : t.move === 'R' ? '→' : '•'
              
              return (
                <TransitionArrow
                  key={t.key}
                  from={positions[t.from]}
                  to={positions[t.to]}
                    label={`${t.read || 'λ'}→${t.write || 'λ'},${moveArrow}`}
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

              {tm.states.map(id => {
              const pos = positions[id]
              if (!pos) return null
              const isSelected = id === selected
              const isHovered = hoverState === id
                const isStart = tm.start === id
                const isAccept = tm.accept.includes(id)
                const active = isSimulating && currentState === id
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
                  
                  {!isSimulating && (
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
          <div><strong>Estados:</strong> {tm.states.length} | <strong>Transições:</strong> {transitions.length}</div>
          <div><strong>Zoom:</strong> {(zoom * 100).toFixed(0)}%</div>
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #e0e0e0', fontSize: 11, color: '#666' }}>
            <div>🖱️ <strong>Duplo-clique</strong> em estado: marcar como inicial</div>
            <div>🖱️ <strong>Duplo-clique</strong> em transição: editar read/write/move</div>
            <div>🖱️ <strong>Ctrl+Click</strong> entre estados: criar transição</div>
            <div>⚙️ <strong>Botão vermelho (×)</strong>: remover estado</div>
            <div>🎯 <strong>Roda do mouse</strong>: zoom in/out</div>
            <div>🖱️ <strong>Botão do meio</strong>: arrastar tela (pan)</div>
            <div>📼 <strong>Fita</strong> visível durante simulação no painel lateral</div>
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
        {/* Header com nome do editor */}
        <div style={{ 
          padding: '12px', 
          background: '#fff', 
          color: '#333',
          fontWeight: 'bold',
          fontSize: '16px',
          textAlign: 'center',
          borderBottom: '2px solid #667eea',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          Máquina de Turing
        </div>

        {/* Visualizador de Fita */}
        {isSimulating && (
          <div style={{ padding: 12, borderBottom: '2px solid #ddd', background: '#fff' }}>
              <h4 style={{ margin: '0 0 8px 0' }}>📼 Fita</h4>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              overflow: 'auto',
              padding: 8,
              background: '#f0f0f0',
              border: '2px solid #ff6600',
              borderRadius: 6
            }}>
              {tape.map((symbol, idx) => (
                <div
                  key={idx}
                  style={{
                    minWidth: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: idx === headPosition ? '#ffc107' : '#fff',
                    border: `2px solid ${idx === headPosition ? '#ff6600' : '#ccc'}`,
                    borderRadius: 4,
                    fontWeight: idx === headPosition ? 'bold' : 'normal',
                    fontSize: 16,
                    position: 'relative'
                  }}
                >
                  {symbol === BLANK ? '_' : symbol}
                  {idx === headPosition && (
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
              <strong>Estado atual:</strong> {currentState} | <strong>Posição:</strong> {headPosition}
            </div>
          </div>
        )}

        {/* Simulador */}
        <div style={{ padding: 12, borderBottom: '1px solid #ddd', background: '#fff' }}>
          <h4 style={{ margin: '0 0 8px 0' }}>▶️ Simulação</h4>
          {!isSimulating && !batchResults ? (
            <MultiInputPanel
              onSimulate={(inputs) => {
                if (inputs.length === 1) {
                  // Simulação passo-a-passo
                  setBatchResults(null)
                  startSimulation(inputs[0])
                } else {
                  // Simulação em lote
                  const results = inputs.map(input => ({
                    input,
                    accepted: simulateComplete(input)
                  }))
                  setBatchResults(results)
                }
              }}
              disabled={isSimulating}
              placeholder="Entrada (ex: 0011)"
            />
          ) : batchResults ? (
            <>
              <div style={{
                padding: 8,
                background: '#f0f9ff',
                border: '2px solid #0ea5e9',
                borderRadius: 4,
                marginBottom: 8,
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                📊 Simulação em Lote ({batchResults.filter(r => r.accepted).length}/{batchResults.length} aceitas)
              </div>
              <div style={{ maxHeight: 200, overflow: 'auto', marginBottom: 8 }}>
                {batchResults.map((r, i) => (
                  <div key={i} style={{
                    padding: '6px 8px',
                    marginBottom: 4,
                    background: r.accepted ? '#d4edda' : '#f8d7da',
                    border: `1px solid ${r.accepted ? '#28a745' : '#dc3545'}`,
                    borderRadius: 4,
                    fontSize: 12
                  }}>
                    {i + 1}. "{r.input}" → {r.accepted ? '✅ ACEITA' : '❌ REJEITA'}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setBatchResults(null)}
                style={{
                  padding: '8px 12px',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  width: '100%',
                  fontWeight: 'bold'
                }}
              >
                ◀️ Nova Simulação
              </button>
            </>
          ) : (
            <>
              <div style={{
                padding: 8,
                background: accepted && tm.accept.includes(currentState) ? '#d4edda' : '#fffbe6',
                border: `2px solid ${accepted && tm.accept.includes(currentState) ? '#28a745' : '#ffe58f'}`,
                borderRadius: 4,
                marginBottom: 8,
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                {accepted && tm.accept.includes(currentState) ? '✅ ACEITO' : '⏸️ EXECUTANDO'}
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <button
                  onClick={stepBackward}
                  disabled={currentStep === 0}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: currentStep === 0 ? '#ccc' : '#fff',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    cursor: currentStep === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ⏮ Anterior
                </button>
                <button
                  onClick={stepForward}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    cursor: 'pointer'
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
                <strong>Passo:</strong> {currentStep + 1} / {steps.length}
              </div>
            </>
          )}
        </div>

        {/* Ferramentas */}
        <div style={{ padding: 12, overflow: 'auto', flex: 1, minHeight: 0, background: '#f9f9f9' }}>
          <h4 style={{ margin: '0 0 8px 0' }}>🔧 Ferramentas</h4>
          
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
                fontSize: 12
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
                fontSize: 12
              }}
            >
              ➕ Adicionar Estado
            </button>
          </div>

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

          <h4 style={{ margin: '0 0 6px 0', fontSize: 12 }}>🤖 Máquina de Turing</h4>
          <div style={{ 
            fontSize: 10, 
            lineHeight: 1.6, 
            background: '#fff3cd',
            padding: 6,
            borderRadius: 4,
            border: '2px solid #ffc107',
            marginBottom: 12
          }}>
            <div><strong>Alfabeto:</strong> {tm.alphabet.join(', ')}</div>
            <div><strong>Fita:</strong> {tm.tapeAlphabet.join(', ')}</div>
            <div><strong>Início:</strong> {tm.start || '—'}</div>
            <div><strong>Finais:</strong> {tm.accept.length > 0 ? tm.accept.join(', ') : '—'}</div>
            <div style={{ marginTop: 6, fontSize: 11, color: '#f57c00', fontStyle: 'italic' }}>
              💡 Ctrl+Click para criar transições
            </div>
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
                  {tm.accept.includes(selected) ? '⭕ Remover Final' : '✅ Marcar Final'}
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
                const t = tm.transitions[editingTransition]
                return (
                  <div style={{ fontSize: 10, marginBottom: 6, background: '#f0f0f0', padding: 6, borderRadius: 4 }}>
                    <div><strong>De:</strong> {t.from} <strong>Para:</strong> {t.to}</div>
                    <div><strong>Ler:</strong> {t.read === BLANK ? '_' : t.read}</div>
                    <div><strong>Escrever:</strong> {t.write === BLANK ? '_' : t.write}</div>
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

  const displayLabel = label || 'λ'

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
          x={cx - displayLabel.length * 4.5}
          y={cy - r - 25}
          width={displayLabel.length * 9}
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
          {displayLabel}
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
        x={ctrlX - displayLabel.length * 4.5}
        y={ctrlY - 25}
        width={displayLabel.length * 9}
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
        {displayLabel}
      </text>
    </g>
  )
}
