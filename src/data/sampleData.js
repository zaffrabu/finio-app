export const CATEGORIES = [
  'Vivienda',
  'Supermercado',
  'Comida fuera y delivery',
  'Ocio',
  'Transporte',
  'Mascotas',
  'Belleza',
  'Seguros y salud',
  'Deudas',
  'Ahorro',
  'Envíos familia',
  'Lujo / Compras',
  'Inversión negocio / licencia',
  'Sueldo',
  'Cuidado canino',
  'Otros',
]

export const TIPOS = ['Fijo', 'Variable', 'Ingreso', 'Ahorro', 'Deuda', 'Neutro']

export const BUDGETS = [
  { category: 'Vivienda',                        budget: 700,   tipo: 'Fijo'     },
  { category: 'Supermercado',                    budget: 200,   tipo: 'Variable' },
  { category: 'Comida fuera y delivery',         budget: 80,    tipo: 'Variable' },
  { category: 'Ocio',                            budget: 80,    tipo: 'Variable' },
  { category: 'Transporte',                      budget: 50,    tipo: 'Fijo'     },
  { category: 'Seguros y salud',                 budget: 85,    tipo: 'Variable' },
  { category: 'Belleza',                         budget: 50,    tipo: 'Variable' },
  { category: 'Mascotas',                        budget: 120,   tipo: 'Variable' },
  { category: 'Deudas',                          budget: 165,   tipo: 'Deuda'    },
  { category: 'Envíos familia',                  budget: 150,   tipo: 'Variable' },
  { category: 'Inversión negocio / licencia',    budget: 22,    tipo: 'Fijo'     },
]

export const ACCOUNTS = ['BBVA', 'Wise', 'Trade bank', 'Efectivo', 'Sabadell']

export const sampleTransactions = [
  { id: 1,  date: '2026-03-01', description: 'Sueldo Acceleralia',      amount:  1350.00, category: 'Sueldo',                tipo: 'Ingreso',  account: 'BBVA'     },
  { id: 2,  date: '2026-03-01', description: 'Ahorro BBVA 10%',         amount:  -135.00, category: 'Ahorro',                tipo: 'Ahorro',   account: 'BBVA'     },
  { id: 3,  date: '2026-03-02', description: 'Alquiler',                amount:  -600.00, category: 'Vivienda',              tipo: 'Fijo',     account: 'BBVA'     },
  { id: 4,  date: '2026-03-02', description: 'Luz y gas (Endesa)',       amount:   -68.40, category: 'Vivienda',              tipo: 'Fijo',     account: 'BBVA'     },
  { id: 5,  date: '2026-03-03', description: 'Mercadona',               amount:   -87.40, category: 'Supermercado',          tipo: 'Variable', account: 'BBVA'     },
  { id: 6,  date: '2026-03-03', description: 'Banco BBVA cuota',        amount:  -164.62, category: 'Deudas',                tipo: 'Deuda',    account: 'BBVA'     },
  { id: 7,  date: '2026-03-04', description: 'Abono transporte',        amount:   -20.00, category: 'Transporte',            tipo: 'Fijo',     account: 'BBVA'     },
  { id: 8,  date: '2026-03-05', description: 'Cuidado de Berri',        amount:   100.00, category: 'Cuidado canino',        tipo: 'Ingreso',  account: 'Efectivo' },
  { id: 9,  date: '2026-03-08', description: 'Comisión Acceleralia',    amount:   350.00, category: 'Sueldo',                tipo: 'Ingreso',  account: 'BBVA'     },
  { id: 10, date: '2026-03-08', description: 'Glovo',                   amount:   -18.50, category: 'Comida fuera y delivery', tipo: 'Variable', account: 'BBVA'  },
  { id: 11, date: '2026-03-09', description: 'Mercadona',               amount:   -63.20, category: 'Supermercado',          tipo: 'Variable', account: 'BBVA'     },
  { id: 12, date: '2026-03-10', description: 'Restaurante La Bien',     amount:   -42.00, category: 'Comida fuera y delivery', tipo: 'Variable', account: 'BBVA'  },
  { id: 13, date: '2026-03-11', description: 'Barkibu (seguro Panther)',amount:   -54.00, category: 'Mascotas',               tipo: 'Fijo',     account: 'BBVA'    },
  { id: 14, date: '2026-03-12', description: 'Cuidado de Spock',        amount:   145.00, category: 'Cuidado canino',        tipo: 'Ingreso',  account: 'Efectivo' },
  { id: 15, date: '2026-03-13', description: 'Gimnasio',                amount:   -35.00, category: 'Seguros y salud',       tipo: 'Fijo',     account: 'BBVA'     },
  { id: 16, date: '2026-03-13', description: 'Internet (Vodafone)',      amount:   -30.00, category: 'Vivienda',             tipo: 'Fijo',     account: 'BBVA'     },
  { id: 17, date: '2026-03-15', description: 'Cafetería El Norte',      amount:    -9.60, category: 'Comida fuera y delivery', tipo: 'Variable', account: 'BBVA' },
  { id: 18, date: '2026-03-16', description: 'Uber taxi',               amount:   -14.70, category: 'Transporte',            tipo: 'Variable', account: 'BBVA'     },
  { id: 19, date: '2026-03-17', description: 'Mercadona',               amount:   -55.80, category: 'Supermercado',          tipo: 'Variable', account: 'BBVA'     },
  { id: 20, date: '2026-03-18', description: 'Peluquería',              amount:   -40.00, category: 'Belleza',               tipo: 'Variable', account: 'Efectivo' },
  { id: 21, date: '2026-03-19', description: 'Comida Panther',          amount:   -28.00, category: 'Mascotas',              tipo: 'Variable', account: 'BBVA'     },
  { id: 22, date: '2026-03-20', description: 'Dentista',                amount:   -50.00, category: 'Seguros y salud',       tipo: 'Variable', account: 'BBVA'     },
  { id: 23, date: '2026-03-20', description: 'Mamá (envío)',            amount:  -150.00, category: 'Envíos familia',        tipo: 'Variable', account: 'Wise'     },
  { id: 24, date: '2026-03-22', description: 'Cine + cena con Andree',  amount:   -38.00, category: 'Ocio',                  tipo: 'Variable', account: 'BBVA'     },
  { id: 25, date: '2026-03-23', description: 'Lidl',                    amount:   -47.80, category: 'Supermercado',          tipo: 'Variable', account: 'BBVA'     },
  { id: 26, date: '2026-03-24', description: 'Cuidado de Berri',        amount:    80.00, category: 'Cuidado canino',        tipo: 'Ingreso',  account: 'Efectivo' },
  { id: 27, date: '2026-03-25', description: 'Ahorro Wise',             amount:   -50.00, category: 'Ahorro',                tipo: 'Ahorro',   account: 'Wise'     },
  { id: 28, date: '2026-03-26', description: 'Farmacia',                amount:   -12.40, category: 'Seguros y salud',       tipo: 'Variable', account: 'BBVA'     },
  { id: 29, date: '2026-03-27', description: 'Bolt taxi',               amount:    -8.50, category: 'Transporte',            tipo: 'Variable', account: 'BBVA'     },
  { id: 30, date: '2026-03-28', description: 'Spotify',                 amount:   -10.99, category: 'Ocio',                  tipo: 'Fijo',     account: 'BBVA'     },
  { id: 31, date: '2026-03-29', description: 'Just Eat',                amount:   -22.50, category: 'Comida fuera y delivery', tipo: 'Variable', account: 'BBVA' },
  { id: 32, date: '2026-03-30', description: 'Cuidado de Lady Kar',     amount:    60.00, category: 'Cuidado canino',        tipo: 'Ingreso',  account: 'Efectivo' },
]

export const weeklyData = [
  { week: 'Sem 1', ingresos: 1800, gastos: 1075, ahorro: 135 },
  { week: 'Sem 2', ingresos:  495, gastos:  212, ahorro:   0 },
  { week: 'Sem 3', ingresos:    0, gastos:  249, ahorro:  50 },
  { week: 'Sem 4', ingresos:  140, gastos:  151, ahorro:   0 },
]
