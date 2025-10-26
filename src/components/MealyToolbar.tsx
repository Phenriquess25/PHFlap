import { memo } from 'react';

type Props = {
  onBack?: () => void;
  onClear: () => void;
};

export default memo(function MealyToolbar({ onBack, onClear }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderBottom: '1px solid #ddd',
        background: '#ffffff',
        color: '#1f2937',
      }}
    >
      {/* Botão Voltar */}
      {onBack && (
        <button
          onClick={onBack}
          title="Voltar ao menu principal"
          style={{
            padding: '6px 12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          ← Menu
        </button>
      )}

      <strong style={{ fontSize: 16, marginLeft: onBack ? 20 : 0 }}>⚙️ Mealy Machine Editor</strong>

      <div style={{ width: 1, height: 24, background: '#e5e7eb', margin: '0 8px' }} />

      <button
        onClick={onClear}
        title="Limpar máquina atual"
        style={{
          padding: '6px 12px',
          cursor: 'pointer',
          background: '#E53E3E',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontWeight: 'bold',
        }}
      >
        🗑️ Limpar
      </button>

      {/* Info */}
      <div style={{ marginLeft: 'auto', fontSize: 12 }}>
        <strong>💡 Dica:</strong> Duplo clique = inicial | Botão direito + arraste = transição
      </div>
    </div>
  );
});
