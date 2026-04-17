import React, { useState } from 'react';
import { CATEGORIES } from '../../hooks/useMargen';

const AddGastoModal = ({ isOpen, onClose, onSave }) => {
  const [importe, setImporte] = useState('');
  const [categoria, setCategoria] = useState(null);
  const [nota, setNota] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (importe > 0 && categoria) {
      onSave(importe, categoria, nota);
      setImporte('');
      setCategoria(null);
      setNota('');
      onClose();
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div className="backdrop" onClick={onClose} />
      
      <div className="animate-slide-up" style={{ 
        backgroundColor: 'var(--noche)', 
        borderTopLeftRadius: '28px', 
        borderTopRightRadius: '28px', 
        padding: '20px 24px 40px 24px',
        zIndex: 1001,
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', margin: '0 auto 30px auto' }} />

        <div style={{ position: 'relative', marginBottom: '40px', textAlign: 'center' }}>
          <input
            type="number"
            value={importe}
            onChange={(e) => setImporte(e.target.value)}
            placeholder="0"
            className="font-display"
            autoFocus
            style={{
              fontSize: '56px',
              fontWeight: 900,
              textAlign: 'center',
              width: '100%',
              color: 'var(--brillo)'
            }}
          />
          <span className="font-display" style={{ 
            fontSize: '56px', 
            color: 'var(--brillo)',
            fontWeight: 900,
            marginLeft: '8px',
            opacity: importe ? 1 : 0.3
          }}>€</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <div 
              key={key} 
              onClick={() => setCategoria(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                aspectRatio: '1',
                borderRadius: '10px',
                background: categoria === key ? 'rgba(212, 245, 226, 0.1)' : `rgba(${hexToRgb(cat.color)}, 0.15)`,
                border: categoria === key ? '2px solid var(--acento)' : '2px solid transparent',
                fontSize: '20px',
                transition: 'all 0.2s'
              }}
            >
              {cat.emoji}
            </div>
          ))}
        </div>

        <input
          type="text"
          placeholder="Nota (opcional)"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 0',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '32px',
            fontSize: '14px',
            color: 'white'
          }}
        />

        <button 
          className="btn-primary" 
          onClick={handleSave}
          disabled={!importe || !categoria}
          style={{ opacity: importe && categoria ? 1 : 0.5 }}
        >
          Guardar gasto
        </button>
      </div>
    </div>
  );
};

// Helper to convert hex to rgb string
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

export default AddGastoModal;
