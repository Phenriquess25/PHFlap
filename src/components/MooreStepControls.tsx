import { useState } from 'react';
import { useMooreStore } from '../state/mooreStore';

export default function MooreStepControls() {
  const [inputString, setInputString] = useState('');
  const { simulation, startSimulation, nextStep, prevStep, resetSimulation, stopSimulation } =
    useMooreStore();

  const handleStart = () => {
    if (inputString.trim()) {
      startSimulation(inputString.trim());
    }
  };

  const handleStop = () => {
    stopSimulation();
    setInputString('');
  };

  const currentStep = simulation.steps[simulation.currentStepIndex];
  const isAtStart = simulation.currentStepIndex === 0;
  const isAtEnd = simulation.currentStepIndex === simulation.steps.length - 1;

  if (!simulation.isSimulating) {
    return (
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: '#f9f9f9',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #ddd',
          minWidth: '300px',
          color: '#333',
        }}
      >
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold' }}>
          🎯 Simulação Moore
        </h3>
        <input
          type="text"
          value={inputString}
          onChange={(e) => setInputString(e.target.value)}
          placeholder="Digite a entrada (ex: aabb)"
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '10px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            background: '#fff',
            color: '#333',
            fontSize: '14px',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleStart();
          }}
        />
        <button
          onClick={handleStart}
          disabled={!inputString.trim()}
          style={{
            width: '100%',
            padding: '10px',
            background: inputString.trim() ? '#0066ff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: inputString.trim() ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          ▶️ Iniciar Simulação
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: '#f9f9f9',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #ddd',
        minWidth: '350px',
        color: '#333',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
          {simulation.accepted ? '✅ Aceito' : '❌ Rejeitado'}
        </h3>
        <button
          onClick={handleStop}
          style={{
            padding: '6px 12px',
            background: '#DC2626',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          ⏹️ Parar
        </button>
      </div>

      {/* Informações do passo atual */}
      <div
        style={{
          background: '#fff',
          color: '#333',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '15px',
          fontSize: '13px',
          border: '1px solid #e0e0e0'
        }}
      >
        <div style={{ marginBottom: '8px' }}>
          <strong>Estado:</strong> {currentStep?.state || 'N/A'}
        </div>
        <div style={{ marginBottom: '8px' }}>
          <strong>Entrada:</strong> {currentStep?.input || '(início)'}
        </div>
        <div style={{ marginBottom: '8px' }}>
          <strong>Saída do estado:</strong> {currentStep?.output || '-'}
        </div>
        <div>
          <strong>Entrada restante:</strong> {currentStep?.remainingInput || '(vazio)'}
        </div>
      </div>

      {/* Sequência de saída completa */}
      <div
        style={{
          background: '#fff',
          color: '#333',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '15px',
          fontSize: '13px',
          border: '1px solid #e0e0e0'
        }}
      >
        <strong>Sequência de saída:</strong>
        <div style={{ marginTop: '6px', fontFamily: 'monospace', color: '#10B981', fontWeight: 'bold' }}>
          {simulation.outputSequence.join(' ') || '(vazio)'}
        </div>
      </div>

      {/* Indicador de progresso */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
          <span>Passo {simulation.currentStepIndex + 1} de {simulation.steps.length}</span>
        </div>
        <div style={{ width: '100%', height: '6px', background: '#e0e0e0', borderRadius: '3px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${((simulation.currentStepIndex + 1) / simulation.steps.length) * 100}%`,
              height: '100%',
              background: '#0066ff',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Controles de navegação */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        <button
          onClick={prevStep}
          disabled={isAtStart}
          style={{
            padding: '10px',
            background: isAtStart ? '#ccc' : '#0066ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isAtStart ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          ⏮️ Anterior
        </button>
        <button
          onClick={resetSimulation}
          style={{
            padding: '10px',
            background: '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          🔄 Reiniciar
        </button>
        <button
          onClick={nextStep}
          disabled={isAtEnd}
          style={{
            padding: '10px',
            background: isAtEnd ? '#ccc' : '#0066ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isAtEnd ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          Próximo ⏭️
        </button>
      </div>
    </div>
  );
}
