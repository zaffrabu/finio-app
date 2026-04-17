import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMargen } from '../../hooks/useMargen';

const OnboardingStep2 = () => {
  const { user, actions } = useMargen();
  const [fixedExpenses, setFixedExpenses] = useState(user.fixedExpenses.length > 0 ? user.fixedExpenses : [{ name: '', importe: '' }]);
  const navigate = useNavigate();

  const handleAddField = () => {
    setFixedExpenses([...fixedExpenses, { name: '', importe: '' }]);
  };

  const handleChange = (index, field, value) => {
    const newExpenses = [...fixedExpenses];
    newExpenses[index][field] = value;
    setFixedExpenses(newExpenses);
  };

  const handleFinish = () => {
    // Filter out empty ones and update user
    const valid = fixedExpenses.filter(e => e.name && e.importe > 0);
    // This is a bit tricky since we set fixedExpenses one by one in the hook actions usually, 
    // but here we can just replace the whole array if we want, or call addFixedExpense multiple times.
    // I'll update the hook to allow setting the whole list or just do it here.
    // For simplicity, I'll just save them to localStorage directly and reload the user in the hook, 
    // or better, I'll update the hook to have a setFixedExpenses action.
    
    // Update: I'll just use the actions.addFixedExpense in a loop after clearing.
    // Actually, I'll just use a direct update for the MVP.
    const updatedUser = { ...user, fixedExpenses: valid.map(e => ({ name: e.name, importe: parseFloat(e.importe) })) };
    localStorage.setItem('margen_user', JSON.stringify(updatedUser));
    
    navigate('/');
    window.location.reload(); // Force refresh to sync hook state
  };

  return (
    <div className="light-mode" style={{ minHeight: '100vh', padding: '24px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '40px' }}>
        <p className="text-uppercase-mono" style={{ fontSize: '11px', color: '#5A7A64' }}>Paso 2 de 2</p>
      </div>

      <h1 style={{ fontSize: '26px', color: 'var(--bosque)', marginBottom: '8px' }}>
        ¿Tienes gastos fijos mensuales?
      </h1>
      <p style={{ fontSize: '13px', color: '#5A7A64', fontWeight: 300, marginBottom: '40px' }}>
        Alquiler, hipoteca, suscripciones... los que salen siempre.
      </p>

      <div style={{ flex: 1 }}>
        {fixedExpenses.map((expense, index) => (
          <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Ej: Alquiler"
              value={expense.name}
              onChange={(e) => handleChange(index, 'name', e.target.value)}
              style={{
                flex: 1,
                borderBottom: '1px solid #D4E2D9',
                padding: '8px 0',
                fontSize: '14px',
                color: 'var(--bosque)'
              }}
            />
            <input
              type="number"
              placeholder="0 €"
              value={expense.importe}
              onChange={(e) => handleChange(index, 'importe', e.target.value)}
              className="font-mono"
              style={{
                width: '80px',
                borderBottom: '1px solid #D4E2D9',
                padding: '8px 0',
                fontSize: '14px',
                textAlign: 'right',
                color: 'var(--bosque)'
              }}
            />
          </div>
        ))}

        <button 
          onClick={handleAddField}
          style={{ 
            background: 'none', 
            color: 'var(--acento)', 
            fontSize: '14px', 
            fontWeight: 500,
            padding: '8px 0',
            marginTop: '8px'
          }}
        >
          + Añadir otro
        </button>
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <button 
          className="btn-primary" 
          onClick={handleFinish}
        >
          Ver mi margen
        </button>
        <button 
          onClick={() => navigate('/')}
          style={{ background: 'none', color: '#8AAA94', fontSize: '13px' }}
        >
          Saltar por ahora
        </button>
      </div>
    </div>
  );
};

export default OnboardingStep2;
