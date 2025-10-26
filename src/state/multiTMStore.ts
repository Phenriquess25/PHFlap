import { create } from 'zustand'
import { StateId, Position } from '@model/automata'
import { BLANK, MultiTapeTM, MultiTMStep, MultiTMTransition } from '@model/turing'

interface MultiTMStore {
  machine: MultiTapeTM
  positions: Record<StateId, Position>
  selected: StateId | null
  tempFrom: StateId | null
  simulation: {
    isSimulating: boolean
    currentStepIndex: number
    steps: MultiTMStep[]
    accepted: boolean
  }
  setMachine: (m: MultiTapeTM) => void
  setPositions: (p: Record<StateId, Position>) => void
  setSelected: (id: StateId | null) => void
  setTempFrom: (id: StateId | null) => void
  addState: (pos: Position) => void
  removeState: (id: StateId) => void
  setStart: (id: StateId) => void
  toggleAccept: (id: StateId) => void
  addTransition: (t: MultiTMTransition) => void
  removeTransition: (idx: number) => void
  startSimulation: (input: string) => void
  nextStep: () => void
  prevStep: () => void
  resetSimulation: () => void
  stopSimulation: () => void
}

export const useMultiTMStore = create<MultiTMStore>((set, get) => ({
  machine: {
    type: 'MULTI_TM',
    states: [],
    alphabet: [],
    tapeAlphabet: [BLANK],
    tapeCount: 2,
    start: '',
    accept: [],
    transitions: []
  },
  positions: {},
  selected: null,
  tempFrom: null,
  simulation: {
    isSimulating: false,
    currentStepIndex: 0,
    steps: [],
    accepted: false
  },
  setMachine: (m) => set({ machine: m }),
  setPositions: (p) => set({ positions: p }),
  setSelected: (id) => set({ selected: id }),
  setTempFrom: (id) => set({ tempFrom: id }),
  addState: (pos) => {
    const { machine, positions } = get()
    const newId = `q${machine.states.length}`
    set({
      machine: {
        ...machine,
        states: [...machine.states, newId]
      },
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
        start: machine.start === id ? (machine.states[0] === id ? machine.states[1] : machine.states[0]) : machine.start,
        accept: machine.accept.filter(s => s !== id)
      },
      positions: Object.fromEntries(Object.entries(positions).filter(([k]) => k !== id)),
      selected: null
    })
  },
  setStart: (id) => {
    const { machine } = get()
    set({
      machine: { ...machine, start: id }
    })
  },
  toggleAccept: (id) => {
    const { machine } = get()
    set({
      machine: {
        ...machine,
        accept: machine.accept.includes(id)
          ? machine.accept.filter(s => s !== id)
          : [...machine.accept, id]
      }
    })
  },
  addTransition: (t: MultiTMTransition) => {
    const { machine } = get()
    set({
      machine: {
        ...machine,
        transitions: [...machine.transitions, t]
      }
    })
  },
  removeTransition: (idx: number) => {
    const { machine } = get()
    set({
      machine: {
        ...machine,
        transitions: machine.transitions.filter((_, i) => i !== idx)
      }
    })
  },
  startSimulation: (input: string) => {
    // Initial configuration
    const { machine } = get()
    const tapes = Array(machine.tapeCount).fill([...input + BLANK])
    const heads = Array(machine.tapeCount).fill(0)
    
    const steps: MultiTMStep[] = [{
      kind: 'step',
      message: 'Início da simulação',
      config: {
        state: machine.start,
        tapes,
        heads
      }
    }]

    set({
      simulation: {
        isSimulating: true,
        currentStepIndex: 0,
        steps,
        accepted: false
      }
    })
  },
  nextStep: () => {
    const { simulation } = get()
    if (simulation.currentStepIndex < simulation.steps.length - 1) {
      set({
        simulation: {
          ...simulation,
          currentStepIndex: simulation.currentStepIndex + 1
        }
      })
    }
  },
  prevStep: () => {
    const { simulation } = get()
    if (simulation.currentStepIndex > 0) {
      set({
        simulation: {
          ...simulation,
          currentStepIndex: simulation.currentStepIndex - 1
        }
      })
    }
  },
  resetSimulation: () => {
    const { simulation } = get()
    set({
      simulation: {
        ...simulation,
        currentStepIndex: 0
      }
    })
  },
  stopSimulation: () => {
    set({
      simulation: {
        isSimulating: false,
        currentStepIndex: 0,
        steps: [],
        accepted: false
      }
    })
  }
}))
