import { MooreMachine, TransducerResult, TransducerStep } from '@model/transducers'

export function simulateMoore(machine: MooreMachine, input: string): TransducerResult {
  const trace: TransducerStep[] = []
  const outputSequence: string[] = []
  
  let currentState = machine.start
  const inputSymbols = input.split('')
  
  // Estado inicial - Moore produz saída do estado inicial
  const initialOutput = machine.outputs[currentState] || ''
  outputSequence.push(initialOutput)
  
  trace.push({
    state: currentState,
    input: '',
    output: initialOutput,
    remainingInput: input
  })
  
  // Processar cada símbolo
  for (let i = 0; i < inputSymbols.length; i++) {
    const symbol = inputSymbols[i]
    
    // Buscar transição (suporta múltiplas entradas separadas por vírgula)
    const transition = machine.transitions.find(
      t => t.from === currentState && t.input.split(',').map(s => s.trim()).includes(symbol)
    )
    
    if (!transition) {
      // Sem transição disponível - rejeita
      return {
        accepted: false,
        outputSequence,
        trace
      }
    }
    
    // Executar transição
    currentState = transition.to
    const stateOutput = machine.outputs[currentState] || ''
    outputSequence.push(stateOutput)
    
    trace.push({
      state: currentState,
      input: symbol,
      output: stateOutput,
      remainingInput: inputSymbols.slice(i + 1).join('')
    })
  }
  
  // Máquina de Moore sempre aceita se consegue processar toda a entrada
  return {
    accepted: true,
    outputSequence,
    trace
  }
}
