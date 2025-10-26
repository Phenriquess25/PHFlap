import { PDA, PDAResult, PDAConfiguration, PDAStep, STACK_BOTTOM } from '@model/pda'
import { EPSILON } from '@model/automata'

export function simulatePDA(pda: PDA, input: string): PDAResult {
  const steps: PDAStep[] = []
  
  // Configuração inicial
  const initialConfig: PDAConfiguration = {
    state: pda.start,
    remainingInput: input,
    stack: [STACK_BOTTOM]
  }
  
  steps.push({
    kind: 'step',
    message: `Estado inicial: ${pda.start}, Pilha: [${STACK_BOTTOM}]`,
    config: initialConfig
  })
  
  // BFS para explorar todas as configurações possíveis
  const queue: PDAConfiguration[] = [initialConfig]
  const visited = new Set<string>()
  const maxSteps = 1000 // Prevenir loops infinitos
  let stepCount = 0
  
  while (queue.length > 0 && stepCount < maxSteps) {
    stepCount++
    const config = queue.shift()!
    
    const configKey = `${config.state}:${config.remainingInput}:${config.stack.join(',')}`
    if (visited.has(configKey)) continue
    visited.add(configKey)
    
    // Verificar aceitação (pilha vazia OU estado final)
    if (config.remainingInput === '' && 
        (config.stack.length === 0 || 
         (config.stack.length === 1 && config.stack[0] === STACK_BOTTOM) ||
         pda.accept.includes(config.state))) {
      steps.push({
        kind: 'step',
        message: `✅ ACEITA - Estado: ${config.state}, Pilha: [${config.stack.join(',')}]`,
        config
      })
      return {
        accepted: true,
        trace: {
          title: 'Simulação PDA',
          steps
        }
      }
    }
    
    // Transições epsilon (ε)
    const epsilonTransitions = pda.transitions.filter(
      t => t.from === config.state && 
           t.input === EPSILON &&
           (config.stack.length > 0 && config.stack[config.stack.length - 1] === t.stackPop)
    )
    
    for (const trans of epsilonTransitions) {
      const newStack = [...config.stack]
      newStack.pop() // Remove topo
      
      // Empilha novos símbolos (do final para o início)
      if (trans.stackPush && trans.stackPush !== EPSILON) {
        const pushSymbols = trans.stackPush.split('').reverse()
        newStack.push(...pushSymbols)
      }
      
      const newConfig: PDAConfiguration = {
        state: trans.to,
        remainingInput: config.remainingInput,
        stack: newStack
      }
      
      steps.push({
        kind: 'step',
        message: `ε-transição: ${trans.from} → ${trans.to}, Pop: ${trans.stackPop}, Push: ${trans.stackPush || 'ε'}, Pilha: [${newStack.join(',')}]`,
        config: newConfig,
        transition: trans
      })
      
      queue.push(newConfig)
    }
    
    // Transições com símbolo
    if (config.remainingInput.length > 0) {
      const symbol = config.remainingInput[0]
      const symbolTransitions = pda.transitions.filter(
        t => t.from === config.state && 
             t.input === symbol &&
             (config.stack.length > 0 && config.stack[config.stack.length - 1] === t.stackPop)
      )
      
      for (const trans of symbolTransitions) {
        const newStack = [...config.stack]
        newStack.pop() // Remove topo
        
        // Empilha novos símbolos
        if (trans.stackPush && trans.stackPush !== EPSILON) {
          const pushSymbols = trans.stackPush.split('').reverse()
          newStack.push(...pushSymbols)
        }
        
        const newConfig: PDAConfiguration = {
          state: trans.to,
          remainingInput: config.remainingInput.slice(1),
          stack: newStack
        }
        
        steps.push({
          kind: 'step',
          message: `Lê '${symbol}': ${trans.from} → ${trans.to}, Pop: ${trans.stackPop}, Push: ${trans.stackPush || 'ε'}, Pilha: [${newStack.join(',')}]`,
          config: newConfig,
          transition: trans
        })
        
        queue.push(newConfig)
      }
    }
  }
  
  steps.push({
    kind: 'step',
    message: '❌ REJEITA - Nenhuma configuração de aceitação alcançada',
    config: initialConfig
  })
  
  return {
    accepted: false,
    trace: {
      title: 'Simulação PDA',
      steps
    }
  }
}
