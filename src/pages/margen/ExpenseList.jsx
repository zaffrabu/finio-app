import React from 'react';
import { useMargen, CATEGORIES } from '../../hooks/useMargen';
import { useNavigate } from 'react-router-dom';

const ExpenseList = () => {
  const { gastos, actions, dashboard } = useMargen();
  const navigate = useNavigate();

  // Group by date
  const groupedGastos = gastos.reduce((acc, gasto) => {
    const date = new Date(gasto.fecha).toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long' 
    }).toUpperCase();
    
    // Check if it's today
    const today = new Date().toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long' 
    }).toUpperCase();
    
    const label = date === today ? 'HOY' : date;
    
    if (!acc[label]) acc[label] = [];
    acc[label].push(gasto);
    return acc;
  }, {});

  return (
    <div style={{ backgroundColor: 'var(--noche)', minHeight: '100vh', padding: '24px', color: 'var(--menta)' }}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', gap: '16px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', color: 'var(--brillo)', fontSize: '24px' }}>←</button>
        <h2 className="font-display" style={{ fontSize: '22px', fontWeight: 700 }}>
          Tus gastos · {dashboard.mesActual}
        </h2>
      </header>

      {/* Filter chips (placeholder) */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '32px', paddingBottom: '8px' }}>
        <div className="badge badge-bien" style={{ whiteSpace: 'nowrap' }}>TODOS</div>
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <div key={key} className="badge" style={{ whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.1)' }}>
            {cat.emoji} {cat.label.toUpperCase()}
          </div>
        ))}
      </div>

      <div>
        {Object.entries(groupedGastos).map(([date, items]) => (
          <div key={date} style={{ marginBottom: '32px' }}>
            <h4 className="text-uppercase-mono" style={{ fontSize: '10px', opacity: 0.5, marginBottom: '16px' }}>
              {date}
            </h4>
            
            {items.map((gasto) => (
              <div 
                key={gasto.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  marginBottom: '20px',
                  padding: '4px 0'
                }}
              >
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '10px', 
                  background: `rgba(${hexToRgb(CATEGORIES[gasto.categoria].color)}, 0.15)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {CATEGORIES[gasto.categoria].emoji}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 400 }}>{CATEGORIES[gasto.categoria].label}</span>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>-{gasto.importe.toFixed(2)} €</span>
                  </div>
                  {gasto.nota && (
                    <span style={{ fontSize: '12px', opacity: 0.6 }}>{gasto.nota}</span>
                  )}
                </div>

                <button 
                  onClick={() => actions.removeGasto(gasto.id)}
                  style={{ background: 'none', color: 'var(--alerta)', fontSize: '12px', opacity: 0.4 }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ))}
        
        {gastos.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '60px', opacity: 0.5 }}>
            <p style={{ fontSize: '14px' }}>Anota algo hoy.</p>
            <p style={{ fontSize: '14px' }}>Un gasto pequeño ya cuenta.</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => navigate('/')}>
        +
      </button>
    </div>
  );
};

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

export default ExpenseList;
