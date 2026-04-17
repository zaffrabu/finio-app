import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMargen } from '../../hooks/useMargen';

const OnboardingStep1 = () => {
  const { user, actions } = useMargen();
  const [income, setIncome] = useState(user.income || '');
  const navigate = useNavigate();

  const handleContinue = () => {
    if (income > 0) {
      actions.updateIncome(parseFloat(income));
      navigate('/onboarding/2');
    }
  };

  return (
    <div className="light-mode" style={{ minHeight: '100vh', padding: '24px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '40px' }}>
        <p className="text-uppercase-mono" style={{ fontSize: '11px', color: '#5A7A64' }}>Paso 1 de 2</p>
      </div>

      <h1 style={{ fontSize: '26px', color: 'var(--bosque)', marginBottom: '8px' }}>
        ¿Cuánto ingresas al mes?
      </h1>
      <p style={{ fontSize: '13px', color: '#5A7A64', fontWeight: 300, marginBottom: '60px' }}>
        Puede ser aproximado. Lo puedes cambiar cuando quieras.
      </p>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder="0"
            className="font-display"
            autoFocus
            style={{
              fontSize: '48px',
              fontWeight: 900,
              textAlign: 'center',
              width: '100%',
              borderBottom: '2px solid var(--acento)',
              paddingBottom: '8px',
              color: 'var(--bosque)'
            }}
          />
          <span className="font-display" style={{ 
            position: 'absolute', 
            right: '10%', 
            bottom: '12px', 
            fontSize: '48px', 
            color: 'var(--acento)',
            fontWeight: 900
          }}>€</span>
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <button 
          className="btn-primary" 
          onClick={handleContinue}
          disabled={!income || income <= 0}
          style={{ opacity: income > 0 ? 1 : 0.5 }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default OnboardingStep1;
