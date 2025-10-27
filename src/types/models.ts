// Tipos de modelos computacionais suportados
export type ModelType = 
  | 'FA'           // Finite Automaton (NFA/DFA)
  | 'MEALY'        // Mealy Machine
  | 'MOORE'        // Moore Machine  
  | 'PDA'          // Pushdown Automaton
  | 'TM'           // Turing Machine
  | 'MULTI_TM'     // Multi-Tape Turing Machine
  | 'TM_BLOCKS'    // Turing Machine with Building Blocks
  | 'GRAMMAR'      // Context-Free Grammar
  | 'L_SYSTEM'     // Lindenmayer System
  | 'REGEX'        // Regular Expression
  | 'PUMPING_REG'  // Regular Pumping Lemma
  | 'PUMPING_CFL'  // Context-Free Pumping Lemma

export interface ModelInfo {
  type: ModelType
  name: string
  description: string
  icon: string
  category: 'automaton' | 'transducer' | 'grammar' | 'formal'
}

export const MODEL_CATALOG: ModelInfo[] = [
  {
    type: 'FA',
    name: 'Autômato Finito',
    description: 'Autômato Finito Determinístico (AFD) ou Não-Determinístico (AFN). Dica: Ctrl+Click para criar transições',
    icon: '🔄',
    category: 'automaton'
  },
  {
    type: 'MEALY',
    name: 'Máquina de Mealy',
    description: 'Transdutor com saídas nas transições. Dica: Ctrl+Click para criar transições',
    icon: '⚙️',
    category: 'transducer'
  },
  {
    type: 'MOORE',
    name: 'Máquina de Moore',
    description: 'Transdutor com saídas nos estados. Dica: Ctrl+Click para criar transições',
    icon: '🔧',
    category: 'transducer'
  },
  {
    type: 'PDA',
    name: 'Autômato de Pilha',
    description: 'Autômato com memória em pilha (stack). Dica: Ctrl+Click para criar transições',
    icon: '📚',
    category: 'automaton'
  },
  {
    type: 'TM',
    name: 'Máquina de Turing',
    description: 'Máquina de Turing com fita infinita. Dica: Ctrl+Click para criar transições',
    icon: '🎞️',
    category: 'automaton'
  },
  {
    type: 'MULTI_TM',
    name: 'Máquina de Turing Multi-Fita',
    description: 'Máquina de Turing com múltiplas fitas. Dica: Ctrl+Click para criar transições',
    icon: '🎬',
    category: 'automaton'
  },
  {
    type: 'TM_BLOCKS',
    name: 'Máquina de Turing com Blocos',
    description: 'Máquina de Turing usando blocos de construção. Dica: Ctrl+Click para criar transições',
    icon: '🧱',
    category: 'automaton'
  },
  {
    type: 'GRAMMAR',
    name: 'Gramática',
    description: 'Gramática Livre de Contexto (GLC) ou Regular',
    icon: '📝',
    category: 'grammar'
  },
  {
    type: 'L_SYSTEM',
    name: 'Sistema-L',
    description: 'Sistema de Lindenmayer para geração de fractais',
    icon: '🌿',
    category: 'formal'
  },
  {
    type: 'REGEX',
    name: 'Expressão Regular',
    description: 'Expressões regulares e conversão para autômatos',
    icon: '🔤',
    category: 'formal'
  },
  {
    type: 'PUMPING_REG',
    name: 'Lema do Bombeamento Regular',
    description: 'Ferramenta para provas de não-regularidade',
    icon: '💊',
    category: 'formal'
  },
  {
    type: 'PUMPING_CFL',
    name: 'Lema do Bombeamento Livre de Contexto',
    description: 'Ferramenta para provas de não-contextualidade',
    icon: '💉',
    category: 'formal'
  }
]
