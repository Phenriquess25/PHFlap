import { StateId } from './automata'

// ============= PUSHDOWN AUTOMATON (PDA) =============
export const STACK_BOTTOM = 'Z' // Símbolo de fundo da pilha

export type PDATransition = {
  from: StateId
  to: StateId
  input: string // símbolo lido (ou ε)
  stackPop: string // símbolo desempilhado
  stackPush: string // símbolos empilhados (vazio = não empilha, pode ser múltiplos)
}

export type PDA = {
  type: 'PDA'
  states: StateId[]
  alphabet: string[] // Alfabeto de entrada
  stackAlphabet: string[] // Alfabeto da pilha
  start: StateId
  accept: StateId[] // Estados de aceitação
  transitions: PDATransition[]
}

export type PDAConfiguration = {
  state: StateId
  remainingInput: string
  stack: string[] // Topo no final do array
}

export type PDAStep = {
  kind: 'step'
  message: string
  config: PDAConfiguration
  transition?: PDATransition
}

export type PDAResult = {
  accepted: boolean
  trace: {
    title: string
    steps: PDAStep[]
  }
}
