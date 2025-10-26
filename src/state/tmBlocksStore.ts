import { create } from 'zustand'
import { StateId } from '@model/automata'

// Símbolo de bloco
export const BLOCK = '☐'

// Tipos
export type BlockDirection = 'L' | 'R' | 'S'

export type TMBlockTransition = {
  from: StateId
  to: StateId
  read: string
  write: string
  move: BlockDirection
}

export type TuringMachineBlocks = {
  type: 'TM_BLOCKS'
  states: StateId[]
  alphabet: string[]
  tapeAlphabet: string[]
  start: StateId
  accept: StateId[]
  reject?: StateId
  transitions: TMBlockTransition[]
}

export type TMBlockConfiguration = {
  state: StateId
  tape: string[]
  head: number
}

export type TMBlockStep = {
  kind: 'step' | 'accept' | 'reject' | 'loop'
  message: string
  config: TMBlockConfiguration
  transition?: TMBlockTransition
}

export type TMBlocksSimulation = {
  isSimulating: boolean
  currentStepIndex: number
  steps: TMBlockStep[]
  accepted: boolean
}

// State interface
interface TMBlocksState {
  machine: TuringMachineBlocks
  positions: Record<StateId, { x: number; y: number }>
  selected: StateId | null
  tempFrom: StateId | null
  simulation: TMBlocksSimulation

  setMachine: (tm: TuringMachineBlocks) => void
  setPositions: (pos: Record<StateId, { x: number; y: number }>) => void
  setSelected: (id: StateId | null) => void
  setTempFrom: (id: StateId | null) => void

  addState: (pos: { x: number; y: number }) => void
  removeState: (id: StateId) => void
  setStart: (id: StateId) => void
  toggleAccept: (id: StateId) => void
  
  addTransition: (t: TMBlockTransition) => void
  removeTransition: (idx: number) => void

  startSimulation: (input: string) => void
  nextStep: () => void
  prevStep: () => void
  resetSimulation: () => void
  stopSimulation: () => void
}

// Store
export const useTMBlocksStore = create<TMBlocksState>((set, get) => ({
  machine: {
    type: 'TM_BLOCKS',
    states: [],
    alphabet: [],
    tapeAlphabet: [BLOCK],
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

  setMachine: (tm) => set({ machine: tm }),
  setPositions: (pos) => set({ positions: pos }),
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
      positions: {
        ...positions,
        [newId]: pos
      }
    })
  },

  removeState: (id) => {
    const { machine, positions, selected } = get()
    set({
      machine: {
        ...machine,
        states: machine.states.filter((s) => s !== id),
        start: machine.start === id ? '' : machine.start,
        accept: machine.accept.filter((s) => s !== id),
        reject: machine.reject === id ? undefined : machine.reject,
        transitions: machine.transitions.filter((t) => t.from !== id && t.to !== id)
      },
      positions: Object.fromEntries(Object.entries(positions).filter(([k]) => k !== id)),
      selected: selected === id ? null : selected
    })
  },

  setStart: (id) => {
    const { machine } = get()
    set({
      machine: {
        ...machine,
        start: id
      }
    })
  },

  toggleAccept: (id) => {
    const { machine } = get()
    const isAccept = machine.accept.includes(id)
    set({
      machine: {
        ...machine,
        accept: isAccept
          ? machine.accept.filter((s) => s !== id)
          : [...machine.accept, id]
      }
    })
  },

  addTransition: (t) => {
    const { machine } = get()
    set({
      machine: {
        ...machine,
        transitions: [...machine.transitions, t]
      }
    })
  },

  removeTransition: (idx) => {
    const { machine } = get()
    set({
      machine: {
        ...machine,
        transitions: machine.transitions.filter((_, i) => i !== idx)
      }
    })
  },

  startSimulation: (input) => {
    const { machine } = get()
    const tape = input.split('').concat([BLOCK, BLOCK, BLOCK, BLOCK, BLOCK])
    const steps: TMBlockStep[] = [
      {
        kind: 'step',
        message: 'Configuração inicial',
        config: {
          state: machine.start,
          tape,
          head: 0
        }
      }
    ]

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
    const { machine, simulation } = get()
    
    if (simulation.currentStepIndex < simulation.steps.length - 1) {
      set({
        simulation: {
          ...simulation,
          currentStepIndex: simulation.currentStepIndex + 1
        }
      })
      return
    }

    const currentConfig = simulation.steps[simulation.currentStepIndex].config
    
    if (machine.accept.includes(currentConfig.state)) {
      set({
        simulation: {
          ...simulation,
          accepted: true
        }
      })
      return
    }

    const currentSymbol = currentConfig.tape[currentConfig.head] || BLOCK
    const transition = machine.transitions.find(
      (t) => t.from === currentConfig.state && t.read === currentSymbol
    )

    if (!transition) {
      const newStep: TMBlockStep = {
        kind: 'reject',
        message: 'Nenhuma transição encontrada - REJEITAR',
        config: currentConfig
      }
      set({
        simulation: {
          ...simulation,
          steps: [...simulation.steps, newStep],
          currentStepIndex: simulation.currentStepIndex + 1,
          accepted: false
        }
      })
      return
    }

    const newTape = [...currentConfig.tape]
    newTape[currentConfig.head] = transition.write
    
    let newHead = currentConfig.head
    if (transition.move === 'L') newHead--
    else if (transition.move === 'R') newHead++
    
    if (newHead < 0) {
      newTape.unshift(BLOCK, BLOCK, BLOCK)
      newHead = 2
    }
    if (newHead >= newTape.length) {
      newTape.push(BLOCK, BLOCK, BLOCK)
    }

    const newConfig: TMBlockConfiguration = {
      state: transition.to,
      tape: newTape,
      head: newHead
    }

    const isAccept = machine.accept.includes(transition.to)
    const newStep: TMBlockStep = {
      kind: isAccept ? 'accept' : 'step',
      message: `${transition.from} → ${transition.to} | Ler: ${transition.read === BLOCK ? '☐' : transition.read} | Escrever: ${transition.write === BLOCK ? '☐' : transition.write} | Mover: ${transition.move === 'L' ? '⬅️' : transition.move === 'R' ? '➡️' : '⏸️'}`,
      config: newConfig,
      transition
    }

    set({
      simulation: {
        isSimulating: true,
        steps: [...simulation.steps, newStep],
        currentStepIndex: simulation.currentStepIndex + 1,
        accepted: isAccept
      }
    })
  },

  prevStep: () => {
    const { simulation } = get()
    if (simulation.currentStepIndex > 0) {
      set({
        simulation: {
          ...simulation,
          currentStepIndex: simulation.currentStepIndex - 1,
          accepted: false
        }
      })
    }
  },

  resetSimulation: () => {
    set({
      simulation: {
        isSimulating: false,
        currentStepIndex: 0,
        steps: [],
        accepted: false
      }
    })
  },

  stopSimulation: () => {
    get().resetSimulation()
  }
}))
