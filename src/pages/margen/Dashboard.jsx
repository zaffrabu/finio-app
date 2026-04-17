import React, { useState } from 'react';
import { useMargen, CATEGORIES } from '../../hooks/useMargen';
import { useNavigate } from 'react-router-dom';
import AddGastoModal from '../../components/margen/AddGastoModal';
import AnimatedNumber from '../../components/margen/AnimatedNumber';

const Dashboard = () => {
  const { user, dashboard, situation, actions } = useMargen();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  const handleSaveGasto = (importe, cat, nota) => {
    actions.addGasto(importe, cat, nota);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div style={{ backgroundColor: 'var(--noche)', minHeight: '100vh', padding: '24px', paddingBottom: '100px', color: 'var(--menta)' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '15px', fontWeight: 300, opacity: 0.6, marginBottom: '4px' }}>
            Buenos días, {user.name}
          </p>
          <p style={{ fontSize: '15px', fontWeight: 300, opacity: 0.5 }}>
            Te quedan este mes
          </p>
        </div>
        <button 
          onClick={() => navigate('/gastos')}
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            padding: '8px 16px', 
            borderRadius: '20px', 
            fontSize: '11px', 
            color: 'var(--brillo)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          Gastos
        </button>
      </div>

      {/* Main Balance */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="font-display" style={{ 
          fontSize: '64px', 
          fontWeight: 900, 
          color: 'var(--brillo)',
          letterSpacing: '-2px',
          lineHeight: 1
        }}>
          <AnimatedNumber value={dashboard.currentMargen} /> €
        </h1>
        <p className="text-uppercase-mono" style={{ fontSize: '11px', opacity: 0.4, marginTop: '8px' }}>
          a {dashboard.daysRemaining} días de {dashboard.mesActual}
        </p>
      </div>

      {/* Situation Card */}
      <div className="card-situation" style={{ marginBottom: '48px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className={`badge badge-${situation.estado}`} style={{ fontSize: '14px', padding: '8px' }}>
          {situation.estado === 'bien' ? '✓' : situation.estado === 'aviso' ? '!' : '⚠'}
        </div>
        <p style={{ flex: 1, fontSize: '13px', lineHeight: 1.4 }}>
          {situation.texto}
        </p>
      </div>

      {/* Categories */}
      <div style={{ marginBottom: '48px' }}>
        <h3 className="text-uppercase-mono" style={{ fontSize: '10px', color: 'var(--brillo)', opacity: 0.5, marginBottom: '24px' }}>
          ESTE MES
        </h3>
        
        {Object.entries(dashboard.gastosPorCategoria)
          .filter(([, data]) => data.presupuesto > 0 || data.gastado > 0)
          .map(([key, data], index) => (
          <div key={key} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>{CATEGORIES[key].emoji}</span>
                <span style={{ fontSize: '14px', fontWeight: 400 }}>{CATEGORIES[key].label}</span>
              </div>
              <p style={{ fontSize: '13px', opacity: 0.8 }}>
                <span style={{ fontWeight: 500 }}>{Math.round(data.gastado)}</span>
                <span style={{ opacity: 0.5 }}>/{Math.round(data.presupuesto)}€</span>
              </p>
            </div>
            <div className="progress-track">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${Math.min(data.porcentaje, 100)}%`, 
                  backgroundColor: data.porcentaje >= 90 ? 'var(--aviso)' : CATEGORIES[key].color,
                  transitionDelay: `${index * 100}ms`
                }} 
              />
            </div>
          </div>
        ))}
      </div>

      {/* Suggestion Card */}
      <div style={{ 
        background: 'rgba(255,184,48,0.05)', 
        border: '1px solid rgba(255,184,48,0.15)', 
        borderRadius: '16px', 
        padding: '16px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <span style={{ fontSize: '18px' }}>💡</span>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px', color: 'var(--aviso)' }}>Consejo de la semana</h4>
            <p style={{ fontSize: '13px', lineHeight: 1.4, opacity: 0.8, marginBottom: '12px' }}>
              Llevas 3 Glovo. Bajar a 1 te ahorra ~18€.
            </p>
            <button 
              onClick={() => navigate('/sugerencia')}
              style={{ background: 'none', color: 'var(--brillo)', fontSize: '13px', fontWeight: 500 }}
            >
              Ver más →
            </button>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => setIsModalOpen(true)}>
        +
      </button>

      {/* Toast */}
      {showToast && (
        <div style={{ 
          position: 'fixed', 
          bottom: '100px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          backgroundColor: 'var(--acento)', 
          color: 'var(--noche)',
          padding: '12px 24px',
          borderRadius: '20px',
          fontWeight: 700,
          fontSize: '14px',
          zIndex: 1000,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          animation: 'fadeUp 0.3s ease-out'
        }}>
          Anotado ✓
        </div>
      )}

      {/* Add Gasto Modal */}
      <AddGastoModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveGasto}
      />
    </div>
  );
};

export default Dashboard;
