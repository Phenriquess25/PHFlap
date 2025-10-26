import { DFA, EPSILON, NFA, StateId, StepTrace } from '@model/automata'

function setKey(s: Set<string>): string {
  return [...s].sort().join(',') || '∅'
}

function epsilonClosure(nfa: NFA, states: Set<StateId>, trace?: StepTrace) {
  const stack = [...states]
  const visited = new Set(states)
  while (stack.length) {
    const s = stack.pop()!
    const trans = nfa.transitions[s]?.[EPSILON] as StateId[] | undefined
    if (!trans) continue
    for (const t of trans) {
      if (!visited.has(t)) {
        visited.add(t)
        stack.push(t)
      }
    }
  }
  trace?.steps.push({ kind: 'epsilon-closure', message: `ε-closure({${[...states].join(',')}}) = {${[...visited].join(',')}}`, data: { input: [...states], result: [...visited] } })
  return visited
}

function move(nfa: NFA, states: Set<StateId>, symbol: string, trace?: StepTrace) {
  const dest = new Set<StateId>()
  for (const s of states) {
    const next = nfa.transitions[s]?.[symbol] as StateId[] | undefined
    if (next) for (const t of next) dest.add(t)
  }
  trace?.steps.push({ kind: 'move', message: `move({${[...states].join(',')}}, ${symbol}) = {${[...dest].join(',')}}`, data: { input: [...states], symbol, result: [...dest] } })
  return dest
}

export function determinize(nfa: NFA): { dfa: DFA; trace: StepTrace } {
  const trace: StepTrace = { title: 'Determinização (NFA → DFA)', steps: [] }
  const startSet = epsilonClosure(nfa, new Set([nfa.start]), trace)
  const startKey = setKey(startSet)

  const queue: Set<StateId>[] = [startSet]
  const seen = new Map<string, Set<StateId>>()
  seen.set(startKey, startSet)

  const states: string[] = [startKey]
  const accept: string[] = [...startSet].some(s => nfa.accept.includes(s)) ? [startKey] : []
  const transitions: Record<string, Record<string, string>> = {}

  while (queue.length) {
    const current = queue.shift()!
    const key = setKey(current)
    transitions[key] = transitions[key] || {}
    for (const a of nfa.alphabet) {
      const U = epsilonClosure(nfa, move(nfa, current, a, trace), trace)
      const Ukey = setKey(U)
      if (!seen.has(Ukey)) {
        seen.set(Ukey, U)
        queue.push(U)
        states.push(Ukey)
        if ([...U].some(s => nfa.accept.includes(s))) accept.push(Ukey)
        trace.steps.push({ kind: 'determinize:new-state', message: `Novo estado DFA ${Ukey} a partir de {${[...U].join(',')}}`, data: { subset: [...U], key: Ukey } })
      }
      transitions[key][a] = Ukey
      trace.steps.push({ kind: 'determinize:transition', message: `${key} --${a}→ ${Ukey}`, data: { from: key, symbol: a, to: Ukey } })
    }
  }

  const dfa: DFA = {
    type: 'DFA',
    states,
    alphabet: nfa.alphabet,
    start: startKey,
    accept: Array.from(new Set(accept)),
    transitions,
  }
  return { dfa, trace }
}
