import { create } from 'zustand'
import { TuringMachine, TMResult, BLANK } from '@model/turing'
import { Position, StateId } from '@model/automata'

type TMStore = {
  tm: TuringMachine | null
  positions: Record<StateId, Position>
  result: TMResult | null
  
  setTM: (tm: TuringMachine) => void
  setPositions: (positions: Record<StateId, Position>) => void
  setResult: (result: TMResult | null) => void
  
  createNewTM: () => void
  addState: (id: StateId, pos: Position) => void
}

const emptyTM: TuringMachine = {
  type: 'TM',
  states: [],
  alphabet: ['0', '1'],
  tapeAlphabet: ['0', '1', 'X', 'Y', BLANK],
  start: '',
  accept: [],
  transitions: []
}

export const useTMStore = create<TMStore>((set) => ({
  tm: null,
  positions: {},
  result: null,
  
  setTM: (tm) => set({ tm }),
  setPositions: (positions) => set({ positions }),
  setResult: (result) => set({ result }),
  
  createNewTM: () => set({ 
    tm: { ...emptyTM, states: ['q0'], start: 'q0' },
    positions: { q0: { x: 300, y: 200 } },
    result: null
  }),
  
  addState: (id, pos) => set((state) => ({
    tm: state.tm ? {
      ...state.tm,
      states: [...state.tm.states, id]
    } : null,
    positions: {
      ...state.positions,
      [id]: pos
    }
  }))
}))
