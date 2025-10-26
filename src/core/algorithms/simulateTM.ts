import { TuringMachine, TMResult, TMConfiguration, TMStep, BLANK } from '@model/turing'

export function simulateTM(tm: TuringMachine, input: string): TMResult {
  const steps: TMStep[] = []
  
  // Configuração inicial - fita começa com a entrada
  const initialTape = input.split('')
  if (initialTape.length === 0) initialTape.push(BLANK)
  
  const initialConfig: TMConfiguration = {
    state: tm.start,
    tape: initialTape,
    head: 0
  }
  
  steps.push({
    kind: 'step',
    message: `Início - Estado: ${tm.start}, Fita: [${formatTape(initialTape, 0)}]`,
    config: initialConfig
  })
  
  let currentConfig = { ...initialConfig, tape: [...initialTape] }
  const maxSteps = 10000 // Prevenir loops infinitos
  let stepCount = 0
  const visited = new Set<string>()
  
  while (stepCount < maxSteps) {
    stepCount++
    
    // Verificar aceitação
    if (tm.accept.includes(currentConfig.state)) {
      steps.push({
        kind: 'accept',
        message: `✅ ACEITA - Estado final: ${currentConfig.state}`,
        config: currentConfig
      })
      return {
        accepted: true,
        halted: true,
        finalTape: currentConfig.tape.join('').replace(/_+$/g, ''), // Remove brancos finais
        trace: {
          title: 'Simulação Máquina de Turing',
          steps
        }
      }
    }
    
    // Verificar rejeição
    if (tm.reject && currentConfig.state === tm.reject) {
      steps.push({
        kind: 'reject',
        message: `❌ REJEITA - Estado de rejeição: ${tm.reject}`,
        config: currentConfig
      })
      return {
        accepted: false,
        halted: true,
        finalTape: currentConfig.tape.join('').replace(/_+$/g, ''),
        trace: {
          title: 'Simulação Máquina de Turing',
          steps
        }
      }
    }
    
    // Ler símbolo atual
    const currentSymbol = currentConfig.tape[currentConfig.head] || BLANK
    
    // Buscar transição
    const transition = tm.transitions.find(
      t => t.from === currentConfig.state && t.read === currentSymbol
    )
    
    if (!transition) {
      // Sem transição disponível - rejeita implicitamente
      steps.push({
        kind: 'reject',
        message: `❌ REJEITA - Sem transição para (${currentConfig.state}, '${currentSymbol}')`,
        config: currentConfig
      })
      return {
        accepted: false,
        halted: true,
        finalTape: currentConfig.tape.join('').replace(/_+$/g, ''),
        trace: {
          title: 'Simulação Máquina de Turing',
          steps
        }
      }
    }
    
    // Aplicar transição
    const newTape = [...currentConfig.tape]
    newTape[currentConfig.head] = transition.write
    
    let newHead = currentConfig.head
    if (transition.move === 'L') newHead--
    else if (transition.move === 'R') newHead++
    
    // Expandir fita se necessário
    if (newHead < 0) {
      newTape.unshift(BLANK)
      newHead = 0
    } else if (newHead >= newTape.length) {
      newTape.push(BLANK)
    }
    
    const newConfig: TMConfiguration = {
      state: transition.to,
      tape: newTape,
      head: newHead
    }
    
    // Detectar loop
    const configKey = `${newConfig.state}:${newConfig.head}:${newTape.join('')}`
    if (visited.has(configKey)) {
      steps.push({
        kind: 'loop',
        message: `⚠️ LOOP DETECTADO - Configuração repetida`,
        config: newConfig
      })
      return {
        accepted: false,
        halted: false,
        finalTape: newTape.join('').replace(/_+$/g, ''),
        trace: {
          title: 'Simulação Máquina de Turing',
          steps
        }
      }
    }
    visited.add(configKey)
    
    steps.push({
      kind: 'step',
      message: `${transition.from} → ${transition.to}: Lê '${transition.read}', Escreve '${transition.write}', Move ${transition.move === 'L' ? '←' : transition.move === 'R' ? '→' : '•'}, Fita: [${formatTape(newTape, newHead)}]`,
      config: newConfig,
      transition
    })
    
    currentConfig = newConfig
  }
  
  // Excedeu número máximo de passos
  steps.push({
    kind: 'loop',
    message: `⚠️ LIMITE DE PASSOS EXCEDIDO (${maxSteps})`,
    config: currentConfig
  })
  
  return {
    accepted: false,
    halted: false,
    finalTape: currentConfig.tape.join('').replace(/_+$/g, ''),
    trace: {
      title: 'Simulação Máquina de Turing',
      steps
    }
  }
}

// Formatar fita com indicador de posição da cabeça
function formatTape(tape: string[], head: number): string {
  return tape.map((symbol, i) => 
    i === head ? `[${symbol}]` : symbol
  ).join(' ')
}
