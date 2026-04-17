import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMargen } from '../../hooks/useMargen';

const SuggestionDetail = () => {
  const navigate = useNavigate();
  const { dashboard } = useMargen();
  
  const comidaGasto = Math.round(dashboard.gastosPorCategoria.comida?.gastado || 0);

  return (
    <div className="light-mode" style={{ minHeight: '100vh', padding: '24px', color: 'var(--bosque)' }}>
       <header style={{ marginBottom: '32px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', color: 'var(--acento)', fontSize: '24px', marginBottom: '16px' }}>←</button>
        <h2 className="font-display" style={{ fontSize: '24px', fontWeight: 700 }}>
          Consejo de ahorro
        </h2>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Diagnóstico */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px' }}>📊</span>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#5A7A64' }}>DIAGNÓSTICO</h4>
          </div>
          <p style={{ fontSize: '16px', lineHeight: 1.5 }}>
            Este mes llevas <strong>{comidaGasto} €</strong> en comida a domicilio.
          </p>
        </div>

        {/* Acción */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px' }}>🎯</span>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#5A7A64' }}>ACCIÓN CONCRETA</h4>
          </div>
          <p style={{ fontSize: '16px', lineHeight: 1.5 }}>
            Si bajas de 4 a 2 pedidos esta semana...
          </p>
        </div>

        {/* Resultado */}
        <div style={{ background: 'var(--menta)', padding: '20px', borderRadius: '16px', border: '1px solid var(--acento)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px' }}>✨</span>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--bosque)' }}>RESULTADO ESPERADO</h4>
          </div>
          <p style={{ fontSize: '16px', lineHeight: 1.5, color: 'var(--bosque)' }}>
            ...ahorras <strong>~25 €</strong> antes de que acabe mayo.
          </p>
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '40px' }}>
        <button className="btn-primary" onClick={() => navigate(-1)}>
          Entendido
        </button>
      </div>
    </div>
  );
};

export default SuggestionDetail;
