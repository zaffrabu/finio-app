// Cada regla: { match: string | RegExp, category, tipo }
// Se evalúan en orden — la primera que coincide gana.
// `match` se compara contra la descripción en minúsculas.

export const RULES = [
  // ── INGRESOS ────────────────────────────────────────────────────────────
  { match: /accel/,                       category: 'Sueldo',                   tipo: 'Ingreso' },
  { match: /n[oó]mina|salario|sueldo/,    category: 'Sueldo',                   tipo: 'Ingreso' },
  { match: /cuidado|adiestramiento|paseo|perr[oa]|berri|spock|panther|lady kar|canino/, category: 'Cuidado canino', tipo: 'Ingreso' },
  { match: /comisi[oó]n/,                 category: 'Sueldo',                   tipo: 'Ingreso' },
  { match: /transferencia recibida|ingreso n[oó]mina|abono n[oó]mina/, category: 'Sueldo', tipo: 'Ingreso' },

  // ── INVERSIÓN NEGOCIO / LICENCIAS ──────────────────────────────────────
  { match: /anthropic|claude\.ai|claude\b/,      category: 'Inversión negocio / licencia', tipo: 'Fijo' },
  { match: /notion|figma|canva|midjourney|openai|chatgpt|cursor|github copilot|vercel|netlify|heroku|aws\b|google cloud|digitalocean/, category: 'Inversión negocio / licencia', tipo: 'Fijo' },
  { match: /dominio|hosting|suscripci[oó]n.*negocio|licencia.*software|software.*licencia/, category: 'Inversión negocio / licencia', tipo: 'Fijo' },

  // ── BBVA: tipos de movimiento (columna Movimiento/Concepto del extracto) ──
  { match: /recibo|domiciliaci[oó]n/,     category: 'Vivienda',                 tipo: 'Fijo'    },
  { match: /bizum recibido/,              category: 'Otros',                    tipo: 'Ingreso' },
  { match: /bizum enviado/,               category: 'Envíos familia',           tipo: 'Variable'},
  { match: /cajero|reintegro/,            category: 'Otros',                    tipo: 'Variable'},
  { match: /pago con tarjeta|compra tarjeta/, category: 'Lujo / Compras',       tipo: 'Variable'},
  { match: /loter[ií]as|apuestas|azar/,   category: 'Ocio',                     tipo: 'Variable'},

  // ── AHORRO ──────────────────────────────────────────────────────────────
  { match: /ahorro|savings|piggy/,        category: 'Ahorro',                   tipo: 'Ahorro'  },

  // ── VIVIENDA ────────────────────────────────────────────────────────────
  { match: /alquiler|renta|arrendamiento|hipoteca/, category: 'Vivienda',       tipo: 'Fijo'    },
  { match: /endesa|iberdrola|naturgy|repsol|gas natural|holaluz|octopus|luz|electricidad/, category: 'Vivienda', tipo: 'Fijo' },
  { match: /vodafone|movistar|orange|jazztel|masmovil|digi|internet|fibra/, category: 'Vivienda', tipo: 'Fijo' },
  { match: /agua|canal de isabel|comunidad propietarios|ibi/, category: 'Vivienda', tipo: 'Fijo' },

  // ── SUPERMERCADO ────────────────────────────────────────────────────────
  { match: /mercadona|lidl|aldi|dia\b|carrefour|alcampo|consum|eroski|ahorra?s|freshco|simply|hipercor|supercor|dunnes|el corte ingles aliment/, category: 'Supermercado', tipo: 'Variable' },

  // ── COMIDA FUERA Y DELIVERY ─────────────────────────────────────────────
  { match: /glovo|just.?eat|uber.?eat|deliveroo|telepizza|domino|mcdonalds|mcdonald|burger king|kfc|pans|100 montaditos|fosters|vips|tgif/, category: 'Comida fuera y delivery', tipo: 'Variable' },
  { match: /restaurante|cafeter[ií]a|caf[eé]\b|bar\b|taberna|tasca|bistro|pizzer[ií]a|sushi|ramen|braserie|asador|mesón/, category: 'Comida fuera y delivery', tipo: 'Variable' },

  // ── TRANSPORTE ──────────────────────────────────────────────────────────
  { match: /uber\b|bolt\b|cabify|blablacar|taxi|vtc/,  category: 'Transporte', tipo: 'Variable' },
  { match: /abono.?transporte|metro|renfe|cercan|bus\b|emt\b|tmb\b|tram\b|bicing|valenbisi|sevici/, category: 'Transporte', tipo: 'Fijo' },
  { match: /gasolinera|repsol.?gasolina|bp\b|cepsa|galp|shell|carburante/, category: 'Transporte', tipo: 'Variable' },
  { match: /parking|aparcamiento|peaje|telepeaje|via.?t/, category: 'Transporte', tipo: 'Variable' },
  { match: /vueling|iberia|ryanair|easyjet|wizz|lufthansa|renfe largo|ave\b|alvia|avion/, category: 'Transporte', tipo: 'Variable' },

  // ── MASCOTAS ────────────────────────────────────────────────────────────
  { match: /barkibu|axa.?mascotas|seguros?.?mascota/, category: 'Mascotas',    tipo: 'Fijo'    },
  { match: /veterinari|vet\b|clinica.?animal|hospital.?animal/, category: 'Mascotas', tipo: 'Variable' },
  { match: /kiwoko|tiendanimal|tractive|zooplus|royal.?canin|hills|advance\b|pienso|comida.?(perro|gato|mascota)/, category: 'Mascotas', tipo: 'Variable' },

  // ── BELLEZA ─────────────────────────────────────────────────────────────
  { match: /peluquer[ií]a|barber[ií]a|barbero|nail|u[ñn]as|est[eé]tica|spa\b|masaje|depilacion/, category: 'Belleza', tipo: 'Variable' },
  { match: /primor|sephora|douglas|notino|maquillaje|perfume|cosmeti/, category: 'Belleza', tipo: 'Variable' },

  // ── SEGUROS Y SALUD ─────────────────────────────────────────────────────
  { match: /farmacia|parafarmacia|sanitas|adeslas|asisa|mapfre.?salud|cigna|dkv|axa.?salud/, category: 'Seguros y salud', tipo: 'Variable' },
  { match: /dentista|cl[ií]nica dental|ortodon|m[eé]dico|hospital\b|cl[ií]nica\b|fisio|psic[oó]log/, category: 'Seguros y salud', tipo: 'Variable' },
  { match: /gimnasio|gym\b|mcfit|holmes|metropolitan|synergym|basic.?fit|anytime/, category: 'Seguros y salud', tipo: 'Fijo' },
  { match: /seguro.?(hogar|coche|vida|accidentes?)|mapfre\b|zurich\b|generali\b|allianz\b/, category: 'Seguros y salud', tipo: 'Fijo' },

  // ── DEUDAS ──────────────────────────────────────────────────────────────
  { match: /bbva.?(cuota|pr[eé]stamo|financiaci)|pr[eé]stamo|hipoteca|cuota.?cr[eé]dito|financiaci[oó]n/, category: 'Deudas', tipo: 'Deuda' },
  { match: /amex|american express|tarjeta.?cr[eé]dito|revolut.?cr[eé]dito/, category: 'Deudas', tipo: 'Deuda' },

  // ── ENVÍOS FAMILIA ──────────────────────────────────────────────────────
  { match: /mam[aá]|pap[aá]|familia|remesa|western union|moneygram|transferencia.?(familiar|familia)|env[ií]o.?familiar/, category: 'Envíos familia', tipo: 'Variable' },

  // ── OCIO ────────────────────────────────────────────────────────────────
  { match: /spotify|apple music|tidal|amazon music|deezer/, category: 'Ocio', tipo: 'Fijo' },
  { match: /netflix|hbo|disney|prime video|filmin|crunchyroll|paramount|apple tv/, category: 'Ocio', tipo: 'Fijo' },
  { match: /steam\b|playstation|xbox|nintendo|epic games|humble bundle|twitch/, category: 'Ocio', tipo: 'Variable' },
  { match: /cine\b|teatro|concierto|entrada|eventbrite|ticketmaster|fever\b/, category: 'Ocio', tipo: 'Variable' },
  { match: /amazon\b|fnac|pccomponentes|mediamarkt|worten|el corte ingles(?!.?aliment)/, category: 'Lujo / Compras', tipo: 'Variable' },
  { match: /zara|mango|h&m|primark|bershka|pull.?bear|stradivarius|shein|asos|zalando/, category: 'Lujo / Compras', tipo: 'Variable' },
  { match: /ikea|leroy|bricomart|aki\b|bauhaus/, category: 'Lujo / Compras', tipo: 'Variable' },
]

/**
 * Intenta categorizar una transacción a partir de su descripción.
 * Devuelve { category, tipo } o null si no hay coincidencia.
 *
 * Para ingresos (amount > 0) solo aplica reglas de tipo Ingreso/Ahorro.
 * Para gastos (amount < 0) excluye reglas de Ingreso.
 */
export function autoCategory(description, amount) {
  const desc = String(description || '').toLowerCase()
  const isIncome = amount > 0

  for (const rule of RULES) {
    const match =
      typeof rule.match === 'string'
        ? desc.includes(rule.match)
        : rule.match.test(desc)

    if (!match) continue

    // Ingresos: solo reglas marcadas como Ingreso o Ahorro
    if (isIncome && rule.tipo !== 'Ingreso' && rule.tipo !== 'Ahorro') continue
    // Gastos: no aplicar reglas de Ingreso
    if (!isIncome && rule.tipo === 'Ingreso') continue

    return { category: rule.category, tipo: rule.tipo }
  }

  // Fallback por importe positivo
  if (isIncome) return { category: 'Otros', tipo: 'Ingreso' }

  return null // sin categoría → el usuario la asigna manualmente
}

/**
 * Aprende de una asignación manual guardada: devuelve una nueva regla
 * que se puede persistir en localStorage para usarla en el futuro.
 */
export function learnRule(description, category, tipo) {
  // Usa las primeras 3 palabras significativas como clave
  const key = String(description)
    .toLowerCase()
    .replace(/[^a-záéíóúüñ0-9\s]/gi, '')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 3)
    .join(' ')
    .trim()

  return key ? { match: key, category, tipo } : null
}
