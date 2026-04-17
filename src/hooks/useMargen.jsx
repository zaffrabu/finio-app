import { useState, useEffect, useMemo } from 'react';

// Categorías fixed MVP
export const CATEGORIES = {
  comida: { emoji: '🍔', color: '#FF6B5B', label: 'Comida', budgetPercent: 0.25 },
  transporte: { emoji: '🚇', color: '#2EB87A', label: 'Transporte', budgetPercent: 0.15 },
  ocio: { emoji: '🎉', color: '#FFB830', label: 'Ocio', budgetPercent: 0.15 },
  supermercado: { emoji: '🛒', color: '#72E4A5', label: 'Supermercado', budgetPercent: 0.20 },
  suscripciones: { emoji: '📺', color: '#9B8FFF', label: 'Suscripciones', budgetPercent: 0 }, // Handled by fixed expenses
  salud: { emoji: '💊', color: '#4FC9EF', label: 'Salud', budgetPercent: 0.10 },
  hogar: { emoji: '🏠', color: '#D4F5E2', label: 'Hogar', budgetPercent: 0.10 },
  otros: { emoji: '📦', color: '#8A8A8A', label: 'Otros', budgetPercent: 0.05 },
};

export const useMargen = () => {
  // Persistence
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('margen_user');
    return saved ? JSON.parse(saved) : { income: 0, fixedExpenses: [], name: 'Usuario' };
  });

  const [gastos, setGastos] = useState(() => {
    const saved = localStorage.getItem('margen_gastos');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('margen_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('margen_gastos', JSON.stringify(gastos));
  }, [gastos]);

  // Actions
  const updateIncome = (income) => setUser(prev => ({ ...prev, income }));
  
  const addFixedExpense = (name, importe) => {
    setUser(prev => ({
      ...prev,
      fixedExpenses: [...prev.fixedExpenses, { name, importe: parseFloat(importe) }]
    }));
  };

  const removeFixedExpense = (index) => {
    setUser(prev => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.filter((_, i) => i !== index)
    }));
  };

  const addGasto = (importe, categoria, nota = '') => {
    const newGasto = {
      id: Date.now().toString(),
      importe: parseFloat(importe),
      categoria,
      nota,
      fecha: new Date().toISOString()
    };
    setGastos(prev => [newGasto, ...prev]);
    return newGasto;
  };

  const removeGasto = (id) => {
    setGastos(prev => prev.filter(g => g.id !== id));
  };

  // Dashboard Calculations
  const dashboard = useMemo(() => {
    const totalFixed = user.fixedExpenses.reduce((acc, curr) => acc + curr.importe, 0);
    const totalVariable = gastos.reduce((acc, curr) => acc + curr.importe, 0);
    
    // Margen is what's left after fixed expenses
    const initialMargen = user.income - totalFixed;
    const currentMargen = initialMargen - totalVariable;

    // Remaining days in month
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = lastDay - now.getDate() + 1;

    // Categorized Spending
    const gastosPorCategoria = {};
    Object.keys(CATEGORIES).forEach(key => {
      const spent = gastos
        .filter(g => g.categoria === key)
        .reduce((acc, curr) => acc + curr.importe, 0);
      
      const budget = CATEGORIES[key].budgetPercent * initialMargen;
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;

      gastosPorCategoria[key] = {
        gastado: spent,
        presupuesto: budget,
        porcentaje: percentage
      };
    });

    return {
      currentMargen,
      initialMargen,
      totalVariable,
      daysRemaining,
      gastosPorCategoria,
      mesActual: now.toLocaleString('es-ES', { month: 'long' })
    };
  }, [user, gastos]);

  // Situation Phrase Logic
  const situation = useMemo(() => {
    const { currentMargen, initialMargen, daysRemaining, gastosPorCategoria } = dashboard;
    const porcentajeLibre = initialMargen > 0 ? (currentMargen / initialMargen) * 100 : 0;

    // Detect critical category
    const critical = Object.entries(gastosPorCategoria)
      .sort(([, a], [, b]) => b.porcentaje - a.porcentaje)[0];

    if (critical && critical[1].porcentaje >= 90) {
      return {
        texto: `Atención: ${CATEGORIES[critical[0]].label} ya está al ${Math.round(critical[1].porcentaje)}% y quedan ${daysRemaining} días`,
        estado: 'aviso'
      };
    }

    if (porcentajeLibre > 30) {
      return {
        texto: `Vas bien — llevas el ${Math.round(porcentajeLibre)}% del presupuesto libre`,
        estado: 'bien'
      };
    }

    if (currentMargen < 0) {
      return {
        texto: 'Cuidado: llevas gastado más de lo previsto este mes',
        estado: 'alerta'
      };
    }

    return {
      texto: `Quedan ${Math.round(currentMargen)} € para ${daysRemaining} días`,
      estado: 'bien'
    };
  }, [dashboard]);

  return {
    user,
    gastos,
    dashboard,
    situation,
    actions: {
      updateIncome,
      addFixedExpense,
      removeFixedExpense,
      addGasto,
      removeGasto
    }
  };
};
