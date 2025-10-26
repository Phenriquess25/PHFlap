import { StateId } from './automata'

// ============= TURING MACHINE =============
export const BLANK = '_' // Símbolo em branco
export type Direction = 'L' | 'R' | 'S' // Left, Right, Stay

export type TMTransition = {
  from: StateId
  to: StateId
  read: string // Símbolo lido da fita
  write: string // Símbolo escrito na fita
  move: Direction // Direção do movimento
}

export type TuringMachine = {
  type: 'TM'
  states: StateId[]
  alphabet: string[] // Alfabeto de entrada (sem o branco)
  tapeAlphabet: string[] // Alfabeto da fita (inclui branco e símbolos auxiliares)
  start: StateId
  accept: StateId[] // Estados de aceitação
  reject?: StateId // Estado de rejeição (opcional)
  transitions: TMTransition[]
}

export type TMConfiguration = {
  state: StateId
  tape: string[] // Conteúdo da fita
  head: number // Posição da cabeça
}

export type TMStep = {
  kind: 'step' | 'accept' | 'reject' | 'loop'
  message: string
  config: TMConfiguration
  transition?: TMTransition
}

export type TMResult = {
  accepted: boolean
  halted: boolean
  finalTape: string
  trace: {
    title: string
    steps: TMStep[]
  }
}

// ============= MULTI-TAPE TURING MACHINE =============
export type MultiTMTransition = {
  from: StateId
  to: StateId
  reads: string[] // Um símbolo por fita
  writes: string[] // Um símbolo por fita
  moves: Direction[] // Um movimento por fita
}

export type MultiTapeTM = {
  type: 'MULTI_TM'
  states: StateId[]
  alphabet: string[]
  tapeAlphabet: string[]
  tapeCount: number // Número de fitas
  start: StateId
  accept: StateId[]
  reject?: StateId
  transitions: MultiTMTransition[]
}

export type MultiTMConfiguration = {
  state: StateId
  tapes: string[][] // Uma fita por índice
  heads: number[] // Uma posição por fita
}

export type MultiTMStep = {
  kind: 'step' | 'accept' | 'reject' | 'loop'
  message: string
  config: MultiTMConfiguration
  transition?: MultiTMTransition
}
