import { MealyMachine, TransducerResult, TransducerStep } from '@model/transducers'

export function simulateMealy(machine: MealyMachine, input: string): TransducerResult {
  const trace: TransducerStep[] = []
  const outputSequence: string[] = []
  
  let currentState = machine.start
  const inputSymbols = input.split('')
  
  // Estado inicial
  trace.push({
    state: currentState,
    input: '',
    output: '',
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
    outputSequence.push(transition.output)
    currentState = transition.to
    
    trace.push({
      state: currentState,
      input: symbol,
      output: transition.output,
      remainingInput: inputSymbols.slice(i + 1).join('')
    })
  }
  
  // Máquina de Mealy sempre aceita se consegue processar toda a entrada
  return {
    accepted: true,
    outputSequence,
    trace
  }
}
