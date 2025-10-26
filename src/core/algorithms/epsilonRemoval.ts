import { EPSILON, NFA, StateId, StepTrace } from '@model/automata'

function epsilonClosure(nfa: NFA, states: Set<StateId>) {
  const stack = [...states]
  const visited = new Set(states)
  while (stack.length) {
    const s = stack.pop()!
    const trans = nfa.transitions[s]?.[EPSILON] as StateId[] | undefined
    if (!trans) continue
    for (const t of trans) if (!visited.has(t)) { visited.add(t); stack.push(t) }
  }
  return visited
}

export function removeEpsilon(nfa: NFA): { nfa: NFA; trace: StepTrace } {
  const trace: StepTrace = { title: 'Remoção de ε-transições', steps: [] }
  // Compute closure for each state
  const closure = new Map<StateId, Set<StateId>>()
  for (const s of nfa.states) {
    const cl = epsilonClosure(nfa, new Set([s]))
    closure.set(s, cl)
    trace.steps.push({ kind: 'epsilon-closure', message: `ε-closure(${s}) = {${[...cl].join(',')}}` })
  }
  const transitions: Record<StateId, Record<string, StateId[]>> = {}
  for (const p of nfa.states) {
    transitions[p] = {}
    for (const a of nfa.alphabet) {
      const dest = new Set<StateId>()
      for (const q of closure.get(p)!) {
        const row = nfa.transitions[q] || {}
        const to = row[a] as StateId[] | undefined
        if (to) for (const t of to) for (const r of closure.get(t)!) dest.add(r)
      }
      transitions[p][a] = [...dest]
      trace.steps.push({ kind: 'epsilon-removal:update', message: `${p} --${a}→ {${[...dest].join(',')}}` })
    }
  }
  const accept = nfa.states.filter(s => [...closure.get(s)!].some(t => nfa.accept.includes(t)))
  const res: NFA = { ...nfa, transitions, accept }
  return { nfa: res, trace }
}
