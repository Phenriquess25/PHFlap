export type StateId = string
export type Symbol = string

export interface Position {
  x: number
  y: number
}

export interface NFA {
  type: 'NFA'
  states: StateId[]
  alphabet: Symbol[] // does not include EPSILON
  start: StateId
  accept: StateId[]
  // transitions[state][symbol] -> destination states
  transitions: Record<StateId, Record<Symbol, StateId[] | undefined> | undefined>
}

export interface DFA {
  type: 'DFA'
  states: StateId[]
  alphabet: Symbol[]
  start: StateId
  accept: StateId[]
  // transitions[state][symbol] -> single destination state
  transitions: Record<StateId, Record<Symbol, StateId | undefined> | undefined>
}

export type FA = NFA | DFA

export const EPSILON: Symbol = 'ε'

export interface StepDetail {
  kind:
    | 'epsilon-closure'
    | 'move'
    | 'determinize:new-state'
    | 'determinize:transition'
    | 'minimize:init'
    | 'minimize:refine'
    | 'minimize:result'
    | 'epsilon-removal:update'
    | 'simulate:advance'
  message: string
  data?: unknown
}

export interface StepTrace {
  title: string
  steps: StepDetail[]
}
