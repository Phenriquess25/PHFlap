import { memo } from 'react';

type Props = {
  onBack?: () => void;
  onClear: () => void;
};

export default memo(function MooreToolbar({ onBack, onClear }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderBottom: '1px solid #ddd',
        background: '#ffffff',
        color: '#333',
      }}
    >
      <strong style={{ fontSize: 16 }}>🎯 Moore Machine Editor</strong>

      <div style={{ width: 1, height: 24, background: '#e5e7eb', margin: '0 8px' }} />

      <button
        onClick={onClear}
        title="Limpar máquina atual"
        style={{
          padding: '6px 12px',
          cursor: 'pointer',
          background: '#DC2626',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontWeight: 'bold',
        }}
      >
        🗑️ Limpar
      </button>

      {/* Info */}
      <div style={{ marginLeft: 'auto', fontSize: 12, color: '#666' }}>
        <strong>💡 Dica:</strong> Shift+Click canvas = estado | Click estado = transição | Shift+Click estado = saída | Duplo clique = inicial
      </div>
    </div>
  );
});
