# PHFlap - Editor e Simulador de Modelos Computacionais

![PHFlap Banner](https://img.shields.io/badge/PHFlap-v1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript)

**PHFlap** é uma alternativa moderna, multiplataforma e open source ao JFLAP para edição e simulação de modelos computacionais. Desenvolvido com React e TypeScript, oferece uma interface intuitiva e recursos avançados para o estudo de Teoria da Computação.

---

## 📚 **Índice**

- [Recursos](#-recursos)
- [Modelos Suportados](#-modelos-suportados)
- [Instalação](#-instalação)
- [Como Usar](#-como-usar)
- [Atalhos e Dicas](#-atalhos-e-dicas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Tecnologias](#-tecnologias)
- [Desenvolvimento](#-desenvolvimento)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)
- [Autor](#-autor)

---

## ✨ **Recursos**

- ✅ **7 Modelos Computacionais** - AFN/AFD, Mealy, Moore, PDA, TM, Multi-Fita TM, TM com Blocos
- 🎨 **Interface Moderna** - Design limpo e responsivo com dark theme
- 🖱️ **Editor Visual Interativo** - Arraste estados, crie transições com cliques
- ▶️ **Simulação Passo-a-Passo** - Visualize execução com controles de navegação
- 📊 **Múltiplas Entradas** - Teste várias strings simultaneamente
- 🔄 **Transformações** - Determinização, remoção de ε-transições, minimização
- 💾 **Exportação** - Salve e carregue autômatos (JSON)
- 🔍 **Zoom/Pan** - Navegue pelo canvas com zoom e arraste
- ⌨️ **Atalhos de Teclado** - Produtividade aumentada

---

## 🤖 **Modelos Suportados**

### 1️⃣ **Autômato Finito (AFN/AFD)**
- Criação de autômatos determinísticos e não-determinísticos
- Suporte a ε-transições
- **Transformações**:
  - ✨ Determinização (AFN → AFD)
  - ✨ Remoção de ε-transições
  - ✨ Minimização (AFD)
  - 🔄 Alternância AFN ↔ AFD
- **Simulação**: Múltiplas entradas com trace completo

### 2️⃣ **Máquina de Mealy**
- Transdutor com saídas nas transições
- Formato: `entrada/saída`
- Simulação com visualização de saída

### 3️⃣ **Máquina de Moore**
- Transdutor com saídas nos estados
- Saída associada a cada estado
- Simulação com rastreamento de saída

### 4️⃣ **Autômato de Pilha (PDA)**
- Pilha dinâmica durante simulação
- Formato: `entrada,pop/push`
- Visualização da pilha em tempo real

### 5️⃣ **Máquina de Turing**
- Fita infinita com símbolo branco `_`
- Movimentos: L (esquerda), R (direita), S (parado)
- Simulação com visualização da fita

### 6️⃣ **Máquina de Turing Multi-Fita**
- Múltiplas fitas simultâneas (configurável: 1-10 fitas)
- Transições com arrays: `read:[s1,s2], write:[w1,w2], move:[L,R]`
- Visualização de todas as fitas

### 7️⃣ **Máquina de Turing com Blocos** 🧱
- Usa blocos `☐` como símbolo branco
- Interface diferenciada para visualização
- Mesma funcionalidade da TM padrão

---

## 🚀 **Instalação**

### **Pré-requisitos**
- Node.js ≥ 18.0
- npm ou yarn

### **Clone o Repositório**
```bash
git clone https://github.com/Phenriquess25/PHFlap.git
cd PHFlap
```

### **Instale as Dependências**
```bash
npm install
# ou
yarn install
```

### **Execute o Servidor de Desenvolvimento**
```bash
npm run dev
# ou
yarn dev
```

O aplicativo estará disponível em: **http://localhost:5173**

### **Build para Produção**
```bash
npm run build
# ou
yarn build
```

Os arquivos otimizados estarão em `dist/`

---

## 📖 **Como Usar**

### **1. Criar um Autômato**

1. **Selecione um modelo** na tela inicial
2. **Adicione estados**:
   - Clique no botão "➕ Adicionar Estado"
   - Ou pressione `Shift + Clique` no canvas
3. **Configure estados**:
   - **Duplo-clique**: Marcar como final
   - **Clique direito**: Definir como inicial
4. **Crie transições**:
   - Selecione um estado
   - Clique em "→ Criar Transição"
   - Clique no estado de destino
   - Digite o símbolo (ex: `0`, `ε`, `a/b`)

### **2. Simulação**

#### **Entrada Única**
1. Digite a string no campo de entrada (ex: `0011`)
2. Clique em "▶️ Simular"
3. Use os controles:
   - **⏮ Anterior**: Volta um passo
   - **Próximo ⏭**: Avança um passo
   - **⏹ Parar**: Encerra simulação

#### **Múltiplas Entradas**
1. Clique em "📋 Múltiplas Entradas"
2. Digite strings (uma por linha):
   ```
   0011
   101
   000
   ```
3. Clique em "▶️ Simular Todas"
4. Veja resultados em tabela com status (✅/❌)

### **3. Transformações (AFN/AFD)**

- **Determinizar**: Converte AFN → AFD
- **Remover ε**: Elimina ε-transições
- **Minimizar**: Reduz estados do AFD
- **Trocar Tipo**: Alterna entre AFN/AFD

### **4. Navegação no Canvas**

- **Zoom**: Roda do mouse
- **Pan**: Botão do meio + arrastar
- **Mover Estados**: Arrastar com botão esquerdo
- **Zoom Manual**: Botões +/− no canto superior direito

### **5. Edição de Transições**

- **Clique simples**: Seleciona para deletar
- **Duplo-clique** (FA apenas): Edita símbolo

---

## ⌨️ **Atalhos e Dicas**

### **Atalhos de Teclado**
| Ação | Atalho |
|------|--------|
| Adicionar estado | `Shift + Clique` |
| Marcar como final | `Duplo-clique` no estado |
| Definir inicial | `Clique direito` no estado |
| Zoom in | `Scroll up` |
| Zoom out | `Scroll down` |
| Pan | `Botão do meio + Arrastar` |

### **Dicas de Uso**

💡 **Estados**
- Estados iniciais têm fundo azul claro
- Estados finais têm círculo duplo
- Estado atual (simulação) fica amarelo

💡 **Transições**
- **Ctrl+Click em um estado** para criar transições rapidamente
- Labels com **fundo branco** e **fonte 16px** em negrito
- Hover muda cor da seta para azul
- Transições em edição ficam laranja

💡 **Símbolos Especiais**
- `ε` (epsilon) - Transição vazia em AFN
- `_` (underscore) - Branco em TM
- `☐` (bloco) - Branco em TM com Blocos
- `/` - Separador saída (Mealy: `a/0`)
- `,` - Separador PDA (`a,Z/AZ`)

---

## 📁 **Estrutura do Projeto**

```
fa-editor-simulator/
├── src/
│   ├── components/          # Componentes React
│   │   ├── CanvasEditor.tsx      # Editor FA
│   │   ├── MealyEditor.tsx       # Editor Mealy
│   │   ├── MooreEditor.tsx       # Editor Moore
│   │   ├── PDAEditor.tsx         # Editor PDA
│   │   ├── TMEditor.tsx          # Editor TM
│   │   ├── TMBlocksEditor.tsx    # Editor TM Blocos
│   │   ├── MultiTapeTMEditor.tsx # Editor Multi-Fita
│   │   ├── HomeScreen.tsx        # Tela inicial
│   │   └── MultiInputPanel.tsx   # Painel múltiplas entradas
│   ├── core/
│   │   └── algorithms/      # Algoritmos de simulação
│   │       ├── simulate.ts         # Simulação FA
│   │       ├── determinize.ts      # Determinização
│   │       ├── epsilonRemoval.ts   # Remoção ε
│   │       ├── minimize.ts         # Minimização
│   │       ├── simulateMealy.ts    # Simulação Mealy
│   │       ├── simulateMoore.ts    # Simulação Moore
│   │       ├── simulatePDA.ts      # Simulação PDA
│   │       └── simulateTM.ts       # Simulação TM
│   ├── state/               # Gerenciamento de estado (Zustand)
│   │   ├── store.ts              # Store FA
│   │   ├── mealyStore.ts         # Store Mealy
│   │   ├── mooreStore.ts         # Store Moore
│   │   ├── pdaStore.ts           # Store PDA
│   │   ├── tmStore.ts            # Store TM
│   │   ├── tmBlocksStore.ts      # Store TM Blocos
│   │   └── multiTMStore.ts       # Store Multi-Fita
│   ├── types/               # Definições TypeScript
│   │   ├── automata.ts           # Tipos FA
│   │   ├── transducers.ts        # Tipos Mealy/Moore
│   │   ├── pda.ts                # Tipos PDA
│   │   ├── turing.ts             # Tipos TM
│   │   └── models.ts             # Catálogo de modelos
│   ├── styles/
│   │   └── index.css        # Estilos globais
│   ├── App.tsx              # Componente raiz
│   └── main.tsx             # Entry point
├── public/                  # Arquivos estáticos
├── dist/                    # Build de produção
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🛠️ **Tecnologias**

- **[React 18](https://react.dev/)** - Biblioteca UI
- **[TypeScript 5.6](https://www.typescriptlang.org/)** - Tipagem estática
- **[Zustand 4.5](https://zustand-demo.pmnd.rs/)** - Gerenciamento de estado
- **[Vite 5.4](https://vitejs.dev/)** - Build tool
- **[Vitest](https://vitest.dev/)** - Testes unitários
- **SVG** - Renderização de grafos

---

## 👨‍💻 **Desenvolvimento**

### **Executar Testes**
```bash
npm run test
# ou
npm run test:ui  # Interface visual
```

### **Linting/Formatação**
```bash
npm run lint
npm run format
```

### **Adicionar Novo Modelo**

1. **Defina tipos** em `src/types/`
2. **Crie store** em `src/state/`
3. **Implemente algoritmo** em `src/core/algorithms/`
4. **Crie componente editor** em `src/components/`
5. **Registre** em `src/types/models.ts`:
   ```ts
   {
     type: 'NEW_MODEL',
     name: 'Novo Modelo',
     description: 'Descrição',
     icon: '🔥',
     category: 'automaton'
   }
   ```
6. **Adicione rota** em `src/App.tsx`

---

## 🤝 **Contribuindo**

Contribuições são bem-vindas! Para contribuir:

1. **Fork** o projeto
2. **Clone** seu fork:
   ```bash
   git clone https://github.com/seu-usuario/PHFlap.git
   ```
3. **Crie uma branch**:
   ```bash
   git checkout -b feature/nova-funcionalidade
   ```
4. **Commit** suas mudanças:
   ```bash
   git commit -m "feat: adiciona nova funcionalidade"
   ```
5. **Push** para o GitHub:
   ```bash
   git push origin feature/nova-funcionalidade
   ```
6. **Abra um Pull Request**

### **Convenções de Commits**
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação/estilo
- `refactor:` - Refatoração
- `test:` - Testes
- `chore:` - Manutenção

---

## 📄 **Licença**

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👤 **Autor**

**Phenriquess25**  
📧 Email: phss22@ic.ufal.br  
🐙 GitHub: [@Phenriquess25](https://github.com/Phenriquess25)  
🏫 Universidade Federal de Alagoas (UFAL) - Instituto de Computação

---

## 🌟 **Agradecimentos**

- Inspirado no [JFLAP](http://www.jflap.org/)
- Comunidade React e TypeScript
- Professores e alunos de Teoria da Computação da UFAL

---

## 🔮 **Roadmap**

- [ ] Importação/Exportação JFLAP (.jff)
- [ ] Gramáticas Livres de Contexto
- [ ] Sistema-L (Lindenmayer)
- [ ] Expressões Regulares → AFN
- [ ] Lema do Bombeamento
- [ ] Modo offline (PWA)
- [ ] Temas customizáveis
- [ ] Compartilhamento via URL
- [ ] Histórico de operações (Undo/Redo)

---

## 📞 **Suporte**

Encontrou um bug? Tem uma sugestão?

- 🐛 [Reporte um Bug](https://github.com/Phenriquess25/PHFlap/issues/new?labels=bug)
- 💡 [Sugira uma Feature](https://github.com/Phenriquess25/PHFlap/issues/new?labels=enhancement)
- 📖 [Documentação](https://github.com/Phenriquess25/PHFlap#readme)

---

<div align="center">

**PHFlap** - Teoria da Computação na prática 🚀

Feito por [Phenriquess25](https://github.com/Phenriquess25)

[⬆ Voltar ao topo](#phflap---editor-e-simulador-de-modelos-computacionais)

</div>
