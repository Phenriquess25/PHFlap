import { create } from 'zustand'
import { MealyMachine, MealyTransition, TransducerStep } from '@model/transducers'
import { StateId, Position } from '@model/automata'

interface SimulationState {
  isSimulating: boolean
  currentStepIndex: number
  steps: TransducerStep[]
  outputSequence: string[]
  accepted: boolean
  highlightedTransition: { from: string; to: string; input: string } | null
}

interface MealyStore {
  machine: MealyMachine
  positions: Record<StateId, Position>
  selected: StateId | null
  tempFrom: StateId | null
  mode: 'select' | 'addState' | 'addTransition'
  simulation: SimulationState
  setMachine: (m: MealyMachine) => void
  setPositions: (p: Record<StateId, Position>) => void
  setSelected: (id: StateId | null) => void
  setTempFrom: (id: StateId | null) => void
  setMode: (m: 'select' | 'addState' | 'addTransition') => void
  addState: (pos: Position) => void
  removeState: (id: StateId) => void
  setStart: (id: StateId) => void
  beginTransition: (from: StateId) => void
  addTransition: (t: MealyTransition) => void
  removeTransition: (idx: number) => void
  startSimulation: (input: string) => void
  nextStep: () => void
  prevStep: () => void
  resetSimulation: () => void
  stopSimulation: () => void
}

const initialMachine: MealyMachine = {
  type: 'MEALY',
  states: [],
  alphabet: [],
  outputAlphabet: [],
  start: '',
  transitions: []
}

export const useMealyStore = create<MealyStore>((set, get) => ({
  machine: initialMachine,
  positions: {},
  selected: null,
  tempFrom: null,
  mode: 'select',
  simulation: {
    isSimulating: false,
    currentStepIndex: -1,
    steps: [],
    outputSequence: [],
    accepted: false,
    highlightedTransition: null
  },
  setMachine: (m) => set({ machine: m }),
  setPositions: (p) => set({ positions: p }),
  setSelected: (id) => set({ selected: id }),
  setTempFrom: (id) => set({ tempFrom: id }),
  setMode: (m) => set({ mode: m, tempFrom: null }),
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
  beginTransition: (from) => {
    set({ tempFrom: from, mode: 'addTransition' })
  },
  addTransition: (t) => {
    const { machine } = get()
    set({ machine: { ...machine, transitions: [...machine.transitions, t] }, tempFrom: null, mode: 'select' })
  },
  removeTransition: (idx) => {
    const { machine } = get()
    set({ machine: { ...machine, transitions: machine.transitions.filter((_, i) => i !== idx) } })
  },
  
  // Simulação passo a passo
  startSimulation: (input: string) => {
    const { machine } = get()
    import('@core/algorithms/simulateMealy').then(mod => {
      const result = mod.simulateMealy(machine, input)
      
      set({
        simulation: {
          isSimulating: true,
          currentStepIndex: 0,
          steps: result.trace,
          outputSequence: result.outputSequence,
          accepted: result.accepted,
          highlightedTransition: null
        },
        selected: result.trace[0]?.state || null
      })
    })
  },
  
  nextStep: () => {
    const { simulation, machine } = get()
    if (simulation.currentStepIndex < simulation.steps.length - 1) {
      const nextIndex = simulation.currentStepIndex + 1
      const nextStep = simulation.steps[nextIndex]
      const prevStep = simulation.steps[nextIndex - 1]
      
      // Encontrar transição destacada
      const transition = machine.transitions.find(
        t => t.from === prevStep.state && 
             t.to === nextStep.state && 
             t.input === nextStep.input
      )
      
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
        selected: nextStep.state
      })
    }
  },
  
  prevStep: () => {
    const { simulation, machine } = get()
    if (simulation.currentStepIndex > 0) {
      const prevIndex = simulation.currentStepIndex - 1
      const prevStep = simulation.steps[prevIndex]
      const currentStep = simulation.steps[simulation.currentStepIndex]
      
      // Encontrar transição destacada
      const transition = machine.transitions.find(
        t => t.from === prevStep.state && 
             t.to === currentStep.state && 
             t.input === currentStep.input
      )
      
      set({
        simulation: {
          ...simulation,
          currentStepIndex: prevIndex,
          highlightedTransition: transition ? {
            from: transition.from,
            to: transition.to,
            input: transition.input
          } : null
        },
        selected: prevStep.state
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
        selected: simulation.steps[0]?.state || null
      })
    }
  },
  
  stopSimulation: () => {
    set({
      simulation: {
        isSimulating: false,
        currentStepIndex: -1,
        steps: [],
        outputSequence: [],
        accepted: false,
        highlightedTransition: null
      },
      selected: null
    })
  }
}))
