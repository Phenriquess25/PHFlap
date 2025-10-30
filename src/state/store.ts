import { create } from 'zustand'
import { FA, NFA, StepTrace, StateId, Position, EPSILON } from '@model/automata'

type Store = {
  fa: FA | null
  trace: StepTrace | null
  positions: Record<StateId, Position>
  mode: 'select' | 'addState' | 'addTransition'
  selected: StateId | null
  tempFrom: StateId | null
  setFA: (fa: FA) => void
  setTrace: (t: StepTrace | null) => void
  setMode: (m: Store['mode']) => void
  setSelected: (id: StateId | null) => void
  createNewFA: (type: 'NFA' | 'DFA') => void
  clearFA: () => void
  addState: (id?: string, pos?: Position) => void
  removeState: (id: StateId) => void
  setPosition: (id: StateId, pos: Position) => void
  setStart: (id: StateId) => void
  toggleAccept: (id: StateId) => void
  beginTransition: (from: StateId) => void
  addTransitionTo: (to: StateId, symbol: string) => void
  removeTransition: (from: StateId, to: StateId, symbol: string) => void
  removeAllTransitions: (from: StateId, to: StateId) => void
  editTransition: (from: StateId, to: StateId, oldSymbols: string[], newSymbols: string[]) => void
}

const exampleNFA: NFA = {
  type: 'NFA',
  states: [],
  alphabet: [],
  start: '',
  accept: [],
  transitions: {},
}

export const useAutomataStore = create<Store>((set) => ({
  fa: exampleNFA,
  trace: null,
  positions: {},
  mode: 'select',
  selected: null,
  tempFrom: null,
  setFA: (fa) => set({ fa, trace: null, selected: null, tempFrom: null }),
  setTrace: (t) => set({ trace: t }),
  setMode: (m) => set({ mode: m, tempFrom: null }),
  setSelected: (id) => set({ selected: id }),
  createNewFA: (type) => {
    const newFA: FA = type === 'NFA'
      ? {
          type: 'NFA',
          states: [],
          alphabet: ['a', 'b'],
          start: '',
          accept: [],
          transitions: {}
        }
      : {
          type: 'DFA',
          states: [],
          alphabet: ['a', 'b'],
          start: '',
          accept: [],
          transitions: {}
        }
    set({ 
      fa: newFA, 
      trace: null, 
      selected: null, 
      tempFrom: null, 
      positions: {}
    })
  },
  clearFA: () => set(state => {
    if (!state.fa) return state
    const clearedFA: FA = state.fa.type === 'NFA'
      ? {
          type: 'NFA',
          states: [],
          alphabet: ['a', 'b'],
          start: '',
          accept: [],
          transitions: {}
        }
      : {
          type: 'DFA',
          states: [],
          alphabet: ['a', 'b'],
          start: '',
          accept: [],
          transitions: {}
        }
    return { 
      ...state,
      fa: clearedFA, 
      trace: null, 
      selected: null, 
      tempFrom: null, 
      positions: {}
    }
  }),
  addState: (id, pos) => set(state => {
    const fa = state.fa
    if (!fa) return state
    const newId = id ?? `q${fa.states.length}`
    if (fa.states.includes(newId)) return state
    const nextFA: FA = fa.type === 'NFA'
      ? {
          ...fa,
          states: [...fa.states, newId],
          transitions: { ...fa.transitions, [newId]: {} },
        }
      : {
          ...fa,
          states: [...fa.states, newId],
          transitions: { ...fa.transitions, [newId]: {} },
        }
    return {
      ...state,
      fa: nextFA,
      positions: { ...state.positions, [newId]: pos ?? { x: 100 + 60 * fa.states.length, y: 100 } },
    }
  }),
  removeState: (id) => set(state => {
    const fa = state.fa
    if (!fa) return state
    const states = fa.states.filter(s => s !== id)
    const accept = fa.accept.filter(s => s !== id)
    const start = fa.start === id ? (states[0] ?? '') : fa.start
    const transitions: any = {}
    for (const s of states) {
      const row = fa.transitions[s] || {}
      transitions[s] = {}
      for (const sym in row) {
        const v = (row as any)[sym]
        if (fa.type === 'NFA') transitions[s][sym] = (v as StateId[]).filter(t => t !== id)
        else transitions[s][sym] = v === id ? undefined : v
      }
    }
    return { ...state, fa: { ...(fa as any), states, accept, start, transitions }, selected: null }
  }),
  setPosition: (id, pos) => set(state => ({ positions: { ...state.positions, [id]: pos } })),
  setStart: (id) => set(state => {
    const fa = state.fa
    if (!fa) return state
    return { ...state, fa: { ...(fa as any), start: id } }
  }),
  toggleAccept: (id) => set(state => {
    const fa = state.fa
    if (!fa) return state
    const accept = fa.accept.includes(id) ? fa.accept.filter(s => s !== id) : [...fa.accept, id]
    return { ...state, fa: { ...(fa as any), accept } }
  }),
  beginTransition: (from) => {
    set({ tempFrom: from, mode: 'addTransition' })
  },
  addTransitionTo: (to, symbol) => set(state => {
    const fa = state.fa
    if (!fa) {
      return state
    }
    if (!symbol) {
      return { ...state, tempFrom: null };
    }
    const sym = symbol === 'e' ? EPSILON : symbol;
    if (!fa.alphabet.includes(sym) && sym !== EPSILON) {
      // expand alphabet for non-epsilon
      (fa as any).alphabet = [...fa.alphabet, sym];
    }
    if (fa.type === 'NFA') {
      const row = fa.transitions[state.tempFrom! ] || {};
      const arr = (row[sym] as StateId[] | undefined) ?? [];
      const next: NFA = {
        ...fa,
        transitions: {
          ...fa.transitions,
          [state.tempFrom!]: { ...row, [sym]: Array.from(new Set([...arr, to])) },
        },
      }
      return { ...state, fa: next, tempFrom: null, mode: 'select' }
    } else {
      const row = fa.transitions[state.tempFrom! ] || {}
      const nextTo = row[sym]
      const next = {
        ...fa,
        transitions: {
          ...fa.transitions,
          [state.tempFrom!]: { ...row, [sym]: nextTo ?? to },
        },
      }
      return { ...state, fa: next, tempFrom: null, mode: 'select' }
    }
  }),
  removeTransition: (from, to, symbol) => set(state => {
    const fa = state.fa
    if (!fa) return state
    const sym = symbol === 'e' ? EPSILON : symbol
    const row = fa.transitions[from] || {}
    
    if (fa.type === 'NFA') {
      const arr = (row[sym] as StateId[] | undefined) ?? []
      const filtered = arr.filter(t => t !== to)
      const newRow = { ...row }
      if (filtered.length > 0) {
        newRow[sym] = filtered
      } else {
        delete newRow[sym]
      }
      
      return {
        ...state,
        fa: {
          ...fa,
          transitions: { ...fa.transitions, [from]: newRow }
        } as FA
      }
    } else {
      const newRow = { ...row }
      if (newRow[sym] === to) delete newRow[sym]
      return {
        ...state,
        fa: {
          ...fa,
          transitions: { ...fa.transitions, [from]: newRow }
        } as FA
      }
    }
  }),
  removeAllTransitions: (from, to) => set(state => {
    const fa = state.fa
    if (!fa) return state
    const row = fa.transitions[from] || {}
    const newRow: any = {}
    
    for (const sym in row) {
      if (fa.type === 'NFA') {
        const arr = (row[sym] as StateId[] | undefined) ?? []
        const filtered = arr.filter(t => t !== to)
        if (filtered.length > 0) newRow[sym] = filtered
      } else {
        if (row[sym] !== to) newRow[sym] = row[sym]
      }
    }
    
    return {
      ...state,
      fa: {
        ...fa,
        transitions: { ...fa.transitions, [from]: newRow }
      } as FA
    }
  }),
  editTransition: (from, to, oldSymbols, newSymbols) => set(state => {
    const fa = state.fa
    if (!fa) return state
    
    // Remove old symbols
    let currentFA = fa
    for (const sym of oldSymbols) {
      const symbol = sym === 'ε' ? EPSILON : sym
      const row = currentFA.transitions[from] || {}
      
      if (currentFA.type === 'NFA') {
        const arr = (row[symbol] as StateId[] | undefined) ?? []
        const filtered = arr.filter(t => t !== to)
        const newRow = { ...row }
        if (filtered.length > 0) {
          newRow[symbol] = filtered
        } else {
          delete newRow[symbol]
        }
        currentFA = {
          ...currentFA,
          transitions: { ...currentFA.transitions, [from]: newRow }
        } as FA
      } else {
        const newRow = { ...row }
        if (newRow[symbol] === to) delete newRow[symbol]
        currentFA = {
          ...currentFA,
          transitions: { ...currentFA.transitions, [from]: newRow }
        } as FA
      }
    }
    
    // Add new symbols
    for (const sym of newSymbols) {
      const symbol = sym === 'e' ? EPSILON : sym
      if (!currentFA.alphabet.includes(symbol) && symbol !== EPSILON) {
        currentFA = { ...currentFA, alphabet: [...currentFA.alphabet, symbol] } as FA
      }
      
      if (currentFA.type === 'NFA') {
        const row = currentFA.transitions[from] || {}
        const arr = (row[symbol] as StateId[] | undefined) ?? []
        currentFA = {
          ...currentFA,
          transitions: {
            ...currentFA.transitions,
            [from]: { ...row, [symbol]: Array.from(new Set([...arr, to])) }
          }
        } as FA
      } else {
        const row = currentFA.transitions[from] || {}
        currentFA = {
          ...currentFA,
          transitions: {
            ...currentFA.transitions,
            [from]: { ...row, [symbol]: to }
          }
        } as FA
      }
    }
    
    return { ...state, fa: currentFA }
  }),
}))
