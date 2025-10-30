import { useAutomataStore } from '@state/store'
import { EPSILON, StateId } from '../types/automata'
import { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { simulate } from '@core/algorithms/simulate'
import { determinize } from '@core/algorithms/determinize'
import { removeEpsilon } from '@core/algorithms/epsilonRemoval'
import { minimize } from '@core/algorithms/minimize'
import MultiInputPanel from './MultiInputPanel'

type TransitionKey = string

export default function CanvasEditor() {
  const {
    fa,
    positions,
    mode,
    selected,
    tempFrom,
    trace,
    setMode,
    setSelected,
    addState,
    removeState,
    setPosition,
    setStart,
    toggleAccept,
    beginTransition,
    addTransitionTo,
    removeAllTransitions,
    editTransition,
    setTrace,
    setFA,
    createNewFA,
  } = useAutomataStore()

  const svgRef = useRef<SVGSVGElement | null>(null)
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null)
  const [editingTransition, setEditingTransition] = useState<{ from: string; to: string; symbols: string[] } | null>(null)
  const [hoverState, setHoverState] = useState<string | null>(null)
  const [hoverTransition, setHoverTransition] = useState<TransitionKey | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  
  // Resize states for results panel
  const [resultsHeight, setResultsHeight] = useState(200)
  const [isResizingResults, setIsResizingResults] = useState(false)
  const resizeResultsStartY = useRef(0)
  const resizeResultsStartHeight = useRef(0)
  
  // Modal states for input dialogs (replacing window.prompt)
  const [showInputModal, setShowInputModal] = useState(false)
  const [inputModalConfig, setInputModalConfig] = useState<{
    title: string
    message: string
    defaultValue: string
    onSubmit: (value: string) => void
  } | null>(null)

  const transitions = useMemo(() => {
    if (!fa) return new Map<string, { from: string; to: string; symbols: string[] }>()
    const map = new Map<string, { from: string; to: string; symbols: string[] }>()
    
    for (const s of fa.states) {
      const row = fa.transitions[s] || {}
      for (const sym of Object.keys(row)) {
        if (fa.type === 'NFA') {
          const targets = (row as any)[sym] as StateId[]
          for (const t of targets) {
            const key = `${s}→${t}`
            if (!map.has(key)) map.set(key, { from: s, to: t, symbols: [] })
            if (!map.get(key)!.symbols.includes(sym)) {
              map.get(key)!.symbols.push(sym)
            }
          }
        } else {
          const t = (row as any)[sym] as StateId | undefined
          if (t) {
            const key = `${s}→${t}`
            if (!map.has(key)) map.set(key, { from: s, to: t, symbols: [] })
            if (!map.get(key)!.symbols.includes(sym)) {
              map.get(key)!.symbols.push(sym)
            }
          }
        }
      }
    }
    return map
  }, [fa])

  const onCanvasClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as Element
    if (target !== svgRef.current && !target.hasAttribute('data-background')) return
    
    const rect = svgRef.current!.getBoundingClientRect()
    const rawX = (e.clientX - rect.left - pan.x) / zoom
    const rawY = (e.clientY - rect.top - pan.y) / zoom
    
    if (mode === 'addState' || e.shiftKey) {
      const x = Math.round(rawX / 20) * 20
      const y = Math.round(rawY / 20) * 20
      addState(undefined, { x, y })
      setMode('select')
    } else {
      setSelected(null)
      setEditingTransition(null)
    }
  }, [mode, addState, setMode, setSelected, zoom, pan])

  const onStateMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Atalho: Ctrl+clique para criar transição
    if (e.ctrlKey && selected && selected !== id) {
      setInputModalConfig({
        title: 'Criar Transição',
        message: "Digite os símbolos da transição separados por vírgula.\nUse 'e' para ε (epsilon).\nExemplo: a,b ou e",
        defaultValue: '',
        onSubmit: (input) => {
          if (input) {
            const symbols = input.split(',').map(s => s.trim()).filter(s => s);
            for (const sym of symbols) {
              addTransitionTo(id, sym === 'e' ? EPSILON : sym);
            }
          }
          setShowInputModal(false);
        }
      });
      setShowInputModal(true);
      beginTransition(selected);
      return;
    }
    
    // Atalho: Ctrl+clique no mesmo estado para loop
    if (e.ctrlKey && selected === id) {
      setInputModalConfig({
        title: 'Criar Transição (Loop)',
        message: "Digite os símbolos para o LOOP (auto-transição):\nUse 'e' para ε (epsilon).\nExemplo: a,b ou e",
        defaultValue: '',
        onSubmit: (input) => {
          if (input) {
            const symbols = input.split(',').map(s => s.trim()).filter(s => s);
            for (const sym of symbols) {
              addTransitionTo(id, sym === 'e' ? EPSILON : sym);
            }
          }
          setShowInputModal(false);
        }
      });
      setShowInputModal(true);
      beginTransition(selected);
      return;
    }
    
    if (mode === 'addTransition' && tempFrom) {
      setInputModalConfig({
        title: 'Criar Transição',
        message: tempFrom === id 
          ? "Digite os símbolos para o LOOP (auto-transição):\nUse 'e' para ε (epsilon).\nExemplo: a,b ou e"
          : "Digite os símbolos da transição separados por vírgula.\nUse 'e' para ε (epsilon).\nExemplo: a,b ou e",
        defaultValue: '',
        onSubmit: (input) => {
          if (input) {
            const symbols = input.split(',').map(s => s.trim()).filter(s => s);
            for (const sym of symbols) {
              addTransitionTo(id, sym === 'e' ? EPSILON : sym);
            }
          }
          setMode('select');
          setShowInputModal(false);
        }
      });
      setShowInputModal(true);
      return;
    }
    
    setSelected(id)
    const pos = positions[id]
    if (pos) {
      setDrag({ id, dx: e.clientX - pos.x * zoom - pan.x, dy: e.clientY - pos.y * zoom - pan.y })
    }
  }, [mode, tempFrom, positions, setSelected, addTransitionTo, setMode, zoom, pan, setInputModalConfig, setShowInputModal, selected, beginTransition])

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
      setPosition(drag.id, { x, y })
    }
  }, [drag, setPosition, zoom, pan, isPanning, panStart])

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

  const onTransitionClick = useCallback((from: string, to: string, symbols: string[], e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTransition({ from, to, symbols })
  }, [])

  const onTransitionDoubleClick = useCallback((from: string, to: string, symbols: string[], e: React.MouseEvent) => {
    e.stopPropagation();
    setInputModalConfig({
      title: 'Editar Transição',
      message: 'Editar símbolo da transição:',
      defaultValue: symbols[0] || '',
      onSubmit: (newSymbol) => {
        if (newSymbol && newSymbol.trim() !== '') {
          editTransition(from, to, symbols, [newSymbol.trim()]);
          setEditingTransition(null);
        }
        setShowInputModal(false);
      }
    });
    setShowInputModal(true);
  }, [editTransition, setInputModalConfig, setShowInputModal])

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

  // Handlers for results panel resize
  const handleResultsResizeStart = (e: React.MouseEvent) => {
    setIsResizingResults(true)
    resizeResultsStartY.current = e.clientY
    resizeResultsStartHeight.current = resultsHeight
  }

  const handleResultsResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizingResults) return
    const delta = e.clientY - resizeResultsStartY.current
    const newHeight = Math.max(100, Math.min(600, resizeResultsStartHeight.current + delta))
    setResultsHeight(newHeight)
  }, [isResizingResults, resultsHeight])

  const handleResultsResizeEnd = useCallback(() => {
    setIsResizingResults(false)
  }, [])

  // Event listeners for results resize
  useEffect(() => {
    if (isResizingResults) {
      window.addEventListener('mousemove', handleResultsResizeMove)
      window.addEventListener('mouseup', handleResultsResizeEnd)
      return () => {
        window.removeEventListener('mousemove', handleResultsResizeMove)
        window.removeEventListener('mouseup', handleResultsResizeEnd)
      }
    }
  }, [isResizingResults, handleResultsResizeMove, handleResultsResizeEnd])

  // Função para salvar autômato
  const handleSave = useCallback(() => {
    if (!fa) return
    
    const data = {
      automaton: fa,
      positions: positions,
      version: '1.0.0',
      type: 'FA',
      timestamp: new Date().toISOString()
    }
    
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `automato-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [fa, positions])

  // Função para carregar autômato
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
          if (data.automaton && data.positions) {
            setFA(data.automaton)
            Object.entries(data.positions).forEach(([id, pos]: [string, any]) => {
              setPosition(id, pos)
            })
            setTrace(null)
            setSelected(null)
            setMode('select')
          }
        } catch (error) {
          alert('Erro ao carregar arquivo: formato inválido')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [setFA, setPosition, setTrace, setSelected, setMode])

  if (!fa) return <div style={{ padding: 12 }}>Nenhum autômato</div>

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
            {fa.start && positions[fa.start] && (
              <g>
                <line
                  x1={positions[fa.start].x - 50}
                  y1={positions[fa.start].y}
                  x2={positions[fa.start].x - 28}
                  y2={positions[fa.start].y}
                  stroke="#666"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                <text x={positions[fa.start].x - 75} y={positions[fa.start].y + 5} fontSize="12" fill="#666">Start</text>
              </g>
            )}

            {Array.from(transitions.values()).map(({ from, to, symbols }) => {
              const key = `${from}→${to}`
              const isHovered = hoverTransition === key
              const isEditing = editingTransition?.from === from && editingTransition?.to === to
              
              return (
                <TransitionArrow
                  key={key}
                  from={positions[from]}
                  to={positions[to]}
                  label={symbols.map(s => s === EPSILON ? 'ε' : s).join(', ')}
                  isLoop={from === to}
                  isHovered={isHovered}
                  isEditing={isEditing}
                  onClick={(e) => onTransitionClick(from, to, symbols, e)}
                  onDoubleClick={(e) => onTransitionDoubleClick(from, to, symbols, e)}
                  onMouseEnter={() => setHoverTransition(key)}
                  onMouseLeave={() => setHoverTransition(null)}
                />
              )
            })}

            {fa.states.map(id => {
              const pos = positions[id]
              if (!pos) return null
              const isSelected = id === selected
              const isHovered = hoverState === id
              const isStart = fa.start === id
              const isAccept = fa.accept.includes(id)
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
                    fill={isTempFrom ? '#fff3cd' : isStart ? '#e3f2fd' : '#fff'}
                    stroke={isSelected ? '#0066ff' : isTempFrom ? '#ffc107' : '#333'}
                    strokeWidth={isSelected || isTempFrom ? 3 : 2}
                  />
                  
                  {isAccept && <circle r={20} fill="none" stroke="#333" strokeWidth="2" />}
                  
                  <text textAnchor="middle" dy="5" fontSize="14" fontWeight="bold">{id}</text>
                  
                  {mode === 'select' && (
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
          <div><strong>Estados:</strong> {fa.states.length} | <strong>Transições:</strong> {transitions.size}</div>
          <div><strong>Zoom:</strong> {(zoom * 100).toFixed(0)}%</div>
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #e0e0e0', fontSize: 11, color: '#666' }}>
            <div>🖱️ <strong>Duplo-clique</strong> em estado: toggle estado final</div>
            <div>🖱️ <strong>Clique direito</strong> em estado: marcar como inicial</div>
            <div>🖱️ <strong>Duplo-clique</strong> em transição: editar símbolos</div>
            <div>🖱️ <strong>Ctrl+Click</strong> entre estados: criar transição</div>
            <div>⚙️ <strong>Botão vermelho (×)</strong>: remover estado</div>
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
        <div style={{ padding: 12, borderBottom: '1px solid #ddd', background: '#fff' }}>
          <h4 style={{ margin: '0 0 8px 0' }}>▶️ Simulação</h4>
          <MultiInputPanel
            onSimulate={(inputs) => {
              if (inputs.length === 0 || !fa) return
              
              if (inputs.length === 1) {
                // Simulação única
                const { accepted, trace: simTrace } = simulate(fa, inputs[0])
                setTrace({ 
                  title: `${simTrace.title} • ${accepted ? '✅ ACEITA' : '❌ REJEITA'}`, 
                  steps: simTrace.steps 
                })
              } else {
                // Simulação múltipla
                const results = inputs.map(input => {
                  const { accepted } = simulate(fa, input)
                  return { input, accepted }
                })
                
                const resultSteps = results.map((r, i) => ({
                  kind: 'batch-result' as any,
                  message: `${i + 1}. "${r.input}" → ${r.accepted ? '✅ ACEITA' : '❌ REJEITA'}`,
                  data: r
                }))
                
                const acceptedCount = results.filter(r => r.accepted).length
                setTrace({
                  title: `Simulação em Lote (${acceptedCount}/${results.length} aceitas)`,
                  steps: resultSteps
                })
              }
            }}
            disabled={!fa}
            placeholder="Entrada (ex: aabb)"
          />
        </div>

        <div style={{ height: resultsHeight, overflow: 'auto', borderBottom: '1px solid #ddd', background: '#fff' }}>
          <div style={{ padding: 8, background: '#f6f8fa', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 1 }}>
            <strong style={{ fontSize: 12 }}>{trace?.title ?? '📋 Resultado da Simulação'}</strong>
          </div>
          <ol style={{ margin: 0, padding: '8px 24px', fontSize: 11, lineHeight: 1.5 }}>
            {trace?.steps.map((s, i) => (
              <li key={i} style={{ padding: '3px 0' }}>{s.message}</li>
            )) ?? <li style={{ listStyle: 'none', color: '#999' }}>Nenhuma simulação executada</li>}
          </ol>
        </div>

        {/* Resize Handle for Results */}
        <div
          onMouseDown={handleResultsResizeStart}
          style={{
            width: '100%',
            height: 8,
            background: isResizingResults ? '#2196f3' : '#e0e0e0',
            cursor: 'ns-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: '#666',
            userSelect: 'none',
            transition: 'background 0.2s',
            borderBottom: '1px solid #ddd'
          }}
          title="Arraste para redimensionar resultados"
        >
          ⋮⋮⋮
        </div>

        <div style={{ padding: 12, overflow: 'auto', background: '#f9f9f9', flex: 1 }}>
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

          <h4 style={{ margin: '0 0 6px 0', fontSize: 12 }}>� Arquivo</h4>
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
              💾 Salvar Autômato
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
              📂 Carregar Autômato
            </button>
          </div>

          <h4 style={{ margin: '0 0 6px 0', fontSize: 12 }}>�📋 Autômato: {fa.type === 'NFA' ? '🔀 AFN' : '⚡ AFD'}</h4>
          <div style={{ fontSize: 10, background: fa.type === 'NFA' ? '#e3f2fd' : '#fff3cd', padding: 6, borderRadius: 4, border: `2px solid ${fa.type === 'NFA' ? '#2196f3' : '#ffc107'}`, marginBottom: 8 }}>
            <div><strong>Alfabeto:</strong> {fa.alphabet.join(', ')}</div>
            <div><strong>Início:</strong> {fa.start || '—'}</div>
            <div><strong>Finais:</strong> {fa.accept.length > 0 ? fa.accept.join(', ') : '—'}</div>
            <div style={{ marginTop: 6, fontSize: 11, color: fa.type === 'NFA' ? '#1976d2' : '#f57c00', fontStyle: 'italic' }}>
              💡 Ctrl+Click para criar transições
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
            <button
              onClick={() => createNewFA(fa.type === 'NFA' ? 'DFA' : 'NFA')}
              style={{
                padding: '6px 8px',
                fontSize: 11,
                cursor: 'pointer',
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: 4,
                fontWeight: 'bold'
              }}
            >
              {fa.type === 'NFA' ? '⚡ Trocar para AFD' : '🔀 Trocar para AFN'}
            </button>
            
            {fa.type === 'NFA' && (
              <>
                <button
                  onClick={() => {
                    const { dfa, trace: detTrace } = determinize(fa)
                    setFA(dfa)
                    setTrace(detTrace)
                    // Gerar posições automáticas
                    const newPositions: Record<string, { x: number; y: number }> = {}
                    const radius = 150
                    const centerX = 400
                    const centerY = 300
                    dfa.states.forEach((state, i) => {
                      const angle = (2 * Math.PI * i) / dfa.states.length
                      newPositions[state] = {
                        x: centerX + radius * Math.cos(angle),
                        y: centerY + radius * Math.sin(angle)
                      }
                    })
                    useAutomataStore.setState({ positions: newPositions })
                  }}
                  style={{
                    padding: '6px 8px',
                    fontSize: 11,
                    cursor: 'pointer',
                    background: '#e3f2fd',
                    border: '1px solid #2196f3',
                    borderRadius: 4
                  }}
                >
                  🔄 Determinizar
                </button>
                <button
                  onClick={() => {
                    const { nfa, trace: epsTrace } = removeEpsilon(fa)
                    setFA(nfa)
                    setTrace(epsTrace)
                    // Manter posições existentes
                    const newPositions = { ...positions }
                    nfa.states.forEach((state, i) => {
                      if (!newPositions[state]) {
                        newPositions[state] = { x: 200 + i * 100, y: 200 }
                      }
                    })
                    useAutomataStore.setState({ positions: newPositions })
                  }}
                  style={{
                    padding: '6px 8px',
                    fontSize: 11,
                    cursor: 'pointer',
                    background: '#e3f2fd',
                    border: '1px solid #2196f3',
                    borderRadius: 4
                  }}
                >
                  🧹 Remover ε-transições
                </button>
              </>
            )}
            
            {fa.type === 'DFA' && (
              <button
                onClick={() => {
                  const { dfa, trace: minTrace } = minimize(fa)
                  setFA(dfa)
                  setTrace(minTrace)
                  // Gerar posições automáticas
                  const newPositions: Record<string, { x: number; y: number }> = {}
                  const radius = 150
                  const centerX = 400
                  const centerY = 300
                  dfa.states.forEach((state, i) => {
                    const angle = (2 * Math.PI * i) / dfa.states.length
                    newPositions[state] = {
                      x: centerX + radius * Math.cos(angle),
                      y: centerY + radius * Math.sin(angle)
                    }
                  })
                  useAutomataStore.setState({ positions: newPositions })
                }}
                style={{
                  padding: '6px 8px',
                  fontSize: 11,
                  cursor: 'pointer',
                  background: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: 4
                }}
              >
                ✂️ Minimizar
              </button>
            )}
          </div>

          {selected && (
            <div style={{ borderTop: '1px solid #ddd', paddingTop: 12 }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: 12 }}>⚙️ Estado: {selected}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button onClick={() => setStart(selected)} style={{ padding: '5px', fontSize: 11, cursor: 'pointer' }}>🚀 Definir Inicial</button>
                <button onClick={() => toggleAccept(selected)} style={{ padding: '5px', fontSize: 11, cursor: 'pointer' }}>
                  {fa.accept.includes(selected) ? '⭕ Remover Final' : '✅ Marcar Final'}
                </button>
                <button onClick={() => {
                  beginTransition(selected);
                }} style={{ padding: '5px', fontSize: 11, cursor: 'pointer' }}>→ Criar Transição</button>
                <button onClick={() => { removeState(selected); setSelected(null); }} style={{ padding: '5px', fontSize: 11, cursor: 'pointer', color: 'red' }}>🗑️ Remover</button>
              </div>
            </div>
          )}

          {editingTransition && (
            <div style={{ borderTop: '1px solid #ddd', paddingTop: 12 }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: 12 }}>✏️ Transição</h4>
              <div style={{ fontSize: 10, background: '#f0f0f0', padding: 6, borderRadius: 4, marginBottom: 6 }}>
                <div><strong>De:</strong> {editingTransition.from}</div>
                <div><strong>Para:</strong> {editingTransition.to}</div>
                <div><strong>Símbolos:</strong> {editingTransition.symbols.map(s => s === EPSILON ? 'ε' : s).join(', ')}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button
                  onClick={() => {
                    setInputModalConfig({
                      title: 'Editar Símbolos da Transição',
                      message: "Edite os símbolos (separados por vírgula).\nUse 'e' para ε.\nExemplo: a,b,e",
                      defaultValue: editingTransition.symbols.map(s => s === EPSILON ? 'e' : s).join(','),
                      onSubmit: (input) => {
                        if (input && input.trim()) {
                          const newSymbols = input.split(',').map(s => s.trim()).filter(s => s).map(s => s === 'e' ? EPSILON : s);
                          editTransition(
                            editingTransition.from,
                            editingTransition.to,
                            editingTransition.symbols,
                            newSymbols
                          );
                          setEditingTransition(null);
                        }
                        setShowInputModal(false);
                      }
                    });
                    setShowInputModal(true);
                  }}
                  style={{ padding: '5px', fontSize: 11, cursor: 'pointer' }}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => {
                    removeAllTransitions(editingTransition.from, editingTransition.to)
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

      {/* Modal customizado para substituir window.prompt() */}
      {showInputModal && inputModalConfig && (
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
            <h3 style={{ margin: '0 0 12px 0', fontSize: 18 }}>{inputModalConfig.title}</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: 14, color: '#666', whiteSpace: 'pre-line' }}>
              {inputModalConfig.message}
            </p>
            <input
              type="text"
              defaultValue={inputModalConfig.defaultValue}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  inputModalConfig.onSubmit(e.currentTarget.value);
                } else if (e.key === 'Escape') {
                  setShowInputModal(false);
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
                onClick={() => setShowInputModal(false)}
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
                onClick={(e) => {
                  const input = (e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement)?.value;
                  if (input !== undefined) {
                    inputModalConfig.onSubmit(input);
                  }
                }}
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
      )}
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
  onDoubleClick: (e: React.MouseEvent) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
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
