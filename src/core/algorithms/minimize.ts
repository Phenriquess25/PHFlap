import { DFA, StepTrace } from '@model/automata'

export function minimize(dfa: DFA): { dfa: DFA; trace: StepTrace } {
  const trace: StepTrace = { title: 'Minimização (Hopcroft)', steps: [] }
  // Initialize partitions: accepting vs non-accepting
  let P: Set<string>[] = [new Set(dfa.accept), new Set(dfa.states.filter(s => !dfa.accept.includes(s)))]
  let W: Set<string>[] = P.filter(s => s.size > 0).map(s => new Set(s))
  trace.steps.push({ kind: 'minimize:init', message: `Partições iniciais: ${P.map(s => `{${[...s].join(',')}}`).join(' | ')}` })

  while (W.length) {
    const A = W.pop()!
    for (const a of dfa.alphabet) {
      // X = states that transition on 'a' into A
      const X = new Set<string>()
      for (const s of dfa.states) {
        const t = dfa.transitions[s]?.[a]
        if (t && A.has(t)) X.add(s)
      }
      const newP: Set<string>[] = []
      for (const Y of P) {
        const i1 = new Set([...Y].filter(s => X.has(s)))
        const i2 = new Set([...Y].filter(s => !X.has(s)))
        if (i1.size > 0 && i2.size > 0) {
          newP.push(i1, i2)
          trace.steps.push({ kind: 'minimize:refine', message: `Refina com '${a}': {${[...Y].join(',')}} → {${[...i1].join(',')}} | {${[...i2].join(',')}}` })
          const idx = W.findIndex(S => setEq(S, Y))
          if (idx >= 0) {
            W.splice(idx, 1)
            W.push(i1.size <= i2.size ? i1 : i2)
          } else {
            W.push(i1.size <= i2.size ? i1 : i2)
          }
        } else newP.push(Y)
      }
      P = newP
    }
  }

  // Build minimized DFA
  const rep = new Map<string, string>()
  for (const block of P) {
    const name = [...block].sort().join(',')
    for (const s of block) rep.set(s, name)
  }
  const states = Array.from(new Set(dfa.states.map(s => rep.get(s)!)))
  const start = rep.get(dfa.start)!
  const accept = Array.from(new Set(dfa.accept.map(s => rep.get(s)!)))
  const transitions: Record<string, Record<string, string>> = {}
  for (const S of states) transitions[S] = {}
  for (const s of dfa.states) {
    const S = rep.get(s)!
    for (const a of dfa.alphabet) {
      const t = dfa.transitions[s]?.[a]
      if (t) transitions[S][a] = rep.get(t)!
    }
  }
  const res: DFA = { type: 'DFA', states, alphabet: dfa.alphabet, start, accept, transitions }
  trace.steps.push({ kind: 'minimize:result', message: `Estados: ${states.length} (reduzido)` })
  return { dfa: res, trace }
}

function setEq(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false
  for (const x of a) if (!b.has(x)) return false
  return true
}
