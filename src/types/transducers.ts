import { StateId } from './automata'

// ============= MEALY MACHINE =============
// Saída nas transições: δ(q, a) = (q', o)
export type MealyTransition = {
  from: StateId
  to: StateId
  input: string
  output: string
}

export type MealyMachine = {
  type: 'MEALY'
  states: StateId[]
  alphabet: string[] // Alfabeto de entrada
  outputAlphabet: string[] // Alfabeto de saída
  start: StateId
  transitions: MealyTransition[]
}

// ============= MOORE MACHINE =============
// Saída nos estados: λ(q) = o
export type MooreTransition = {
  from: StateId
  to: StateId
  input: string
}

export type MooreMachine = {
  type: 'MOORE'
  states: StateId[]
  alphabet: string[]
  outputAlphabet: string[]
  start: StateId
  transitions: MooreTransition[]
  outputs: Record<StateId, string> // Saída de cada estado
}

// ============= SIMULAÇÃO =============
export type TransducerStep = {
  state: StateId
  input: string
  output: string
  remainingInput: string
}

export type TransducerResult = {
  accepted: boolean
  outputSequence: string[]
  trace: TransducerStep[]
}
