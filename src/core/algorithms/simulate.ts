import { EPSILON, FA, NFA, StateId, StepTrace } from '@model/automata'

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

export function simulate(fa: FA, input: string): { accepted: boolean; trace: StepTrace } {
  const trace: StepTrace = { title: 'Simulação', steps: [] }
  if (fa.type === 'DFA') {
    let current = fa.start
    for (let i = 0; i < input.length; i++) {
      const a = input[i]
      const next = fa.transitions[current]?.[a]
      trace.steps.push({ kind: 'simulate:advance', message: `${current} --${a}→ ${next ?? '∅'}` })
      if (!next) return { accepted: false, trace }
      current = next
    }
    return { accepted: fa.accept.includes(current), trace }
  } else {
    let current = epsilonClosure(fa, new Set([fa.start]))
    for (let i = 0; i < input.length; i++) {
      const a = input[i]
      const dest = new Set<StateId>()
      for (const s of current) {
        const ns = fa.transitions[s]?.[a] as StateId[] | undefined
        if (ns) for (const t of ns) dest.add(t)
      }
      current = epsilonClosure(fa, dest)
      trace.steps.push({ kind: 'simulate:advance', message: `{${[...current].join(',')}} após ler '${a}'` })
    }
    const accepted = [...current].some(s => fa.accept.includes(s))
    return { accepted, trace }
  }
}
