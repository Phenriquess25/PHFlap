import { create } from 'zustand'
import { PDA, PDATransition, PDAStep } from '../types/pda'
import { StateId, Position } from '../types/automata'

interface SimulationState {
  isSimulating: boolean
  currentStepIndex: number
  steps: PDAStep[]
  accepted: boolean
  highlightedTransition: { from: string; to: string; input: string } | null
}

interface PDAStore {
  machine: PDA
  positions: Record<StateId, Position>
  selected: StateId | null
  tempFrom: StateId | null
  simulation: SimulationState
  setMachine: (m: PDA) => void
  setPositions: (p: Record<StateId, Position>) => void
  setSelected: (id: StateId | null) => void
  setTempFrom: (id: StateId | null) => void
  addState: (pos: Position) => void
  removeState: (id: StateId) => void
  setStart: (id: StateId) => void
  toggleAccept: (id: StateId) => void
  addTransition: (t: PDATransition) => void
  removeTransition: (idx: number) => void
  startSimulation: (input: string) => void
  nextStep: () => void
  prevStep: () => void
  resetSimulation: () => void
  stopSimulation: () => void
}

const initialMachine: PDA = {
  type: 'PDA',
  states: ['q0'],
  alphabet: ['a', 'b'],
  stackAlphabet: ['Z', 'A', 'B'],
  start: 'q0',
  accept: [],
  transitions: []
}

export const usePDAStore = create<PDAStore>((set, get) => ({
  machine: initialMachine,
  positions: { q0: { x: 400, y: 300 } },
  selected: null,
  tempFrom: null,
  simulation: {
    isSimulating: false,
    currentStepIndex: -1,
    steps: [],
    accepted: false,
    highlightedTransition: null
  },
  setMachine: (m) => set({ machine: m }),
  setPositions: (p) => set({ positions: p }),
  setSelected: (id) => set({ selected: id }),
  setTempFrom: (id) => set({ tempFrom: id }),
  addState: (pos) => {
    const { machine, positions } = get()
    const newId = `q${machine.states.length}`
    set({
      machine: { ...machine, states: [...machine.states, newId] },
      positions: { ...positions, [newId]: pos },
      selected: newId
    })
  },
  removeState: (id) => {
    const { machine, positions } = get()
    set({
      machine: {
        ...machine,
        states: machine.states.filter(s => s !== id),
        transitions: machine.transitions.filter(t => t.from !== id && t.to !== id),
        accept: machine.accept.filter(a => a !== id),
        start: machine.start === id ? (machine.states[0] ?? '') : machine.start
      },
      positions: Object.fromEntries(Object.entries(positions).filter(([k]) => k !== id)),
      selected: null
    })
  },
  setStart: (id) => {
    const { machine } = get()
    set({ machine: { ...machine, start: id } })
  },
  toggleAccept: (id) => {
    const { machine } = get()
    const isAccept = machine.accept.includes(id)
    set({
      machine: {
        ...machine,
        accept: isAccept
          ? machine.accept.filter(a => a !== id)
          : [...machine.accept, id]
      }
    })
  },
  addTransition: (t) => {
    const { machine } = get()
    set({ machine: { ...machine, transitions: [...machine.transitions, t] } })
  },
  removeTransition: (idx) => {
    const { machine } = get()
    set({ machine: { ...machine, transitions: machine.transitions.filter((_, i) => i !== idx) } })
  },
  
  // Simulação passo a passo
  startSimulation: (input: string) => {
    const { machine } = get()
    import('../core/algorithms/simulatePDA').then(mod => {
      const result = mod.simulatePDA(machine, input)
      
      set({
        simulation: {
          isSimulating: true,
          currentStepIndex: 0,
          steps: result.trace.steps,
          accepted: result.accepted,
          highlightedTransition: null
        },
        selected: result.trace.steps[0]?.config.state || null
      })
    })
  },
  
  nextStep: () => {
    const { simulation } = get()
    if (simulation.currentStepIndex < simulation.steps.length - 1) {
      const nextIndex = simulation.currentStepIndex + 1
      const nextStep = simulation.steps[nextIndex]
      
      const transition = nextStep.transition
      
      set({
        simulation: {
          ...simulation,
          currentStepIndex: nextIndex,
          highlightedTransition: transition ? {
            from: transition.from,
            to: transition.to,
            input: transition.input
          } : null
        },
        selected: nextStep.config.state
      })
    }
  },
  
  prevStep: () => {
    const { simulation } = get()
    if (simulation.currentStepIndex > 0) {
      const prevIndex = simulation.currentStepIndex - 1
      const prevStep = simulation.steps[prevIndex]
      
      set({
        simulation: {
          ...simulation,
          currentStepIndex: prevIndex,
          highlightedTransition: prevStep.transition ? {
            from: prevStep.transition.from,
            to: prevStep.transition.to,
            input: prevStep.transition.input
          } : null
        },
        selected: prevStep.config.state
      })
    }
  },
  
  resetSimulation: () => {
    const { simulation } = get()
    if (simulation.steps.length > 0) {
      set({
        simulation: {
          ...simulation,
          currentStepIndex: 0,
          highlightedTransition: null
        },
        selected: simulation.steps[0]?.config.state || null
      })
    }
  },
  
  stopSimulation: () => {
    set({
      simulation: {
        isSimulating: false,
        currentStepIndex: -1,
        steps: [],
        accepted: false,
        highlightedTransition: null
      },
      selected: null
    })
  }
}))
