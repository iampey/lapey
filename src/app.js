/* === LA PEY — LÓGICA DE APP === */

const STORAGE_KEY = 'lapey_tareas_v2';
const API_KEY_KEY = 'lapey_api_key';

const EJEMPLOS = [
  "La fresadora de línea 2 ha parado a las 9h por rotura de correa. He contactado mantenimiento, tardaron 2 horas en reparar. Producción perdió 180 piezas. He pedido stock de repuesto para evitar repetición.",
  "Reunión con proveedor Metálicas García. Problemas de suministro de chapa 3mm hasta fin de mes. He cerrado pedido urgente con Aceros del Norte, 15% más caro pero garantiza continuidad de producción.",
  "Cliente Automóviles Renault ha llamado urgente por retraso en lote 447. Coordinado con logística para envío parcial hoy y resto mañana. Cliente conforme. Expediente actualizado.",
  "Detectado que operarios pierden 20 min/día buscando herramientas en almacén. Propongo sistema 5S con panel visual. Hablado con jefe de planta, está de acuerdo. Presentaré propuesta la semana que viene."
];

// ─── ESTADO ────────────────────────────────────────────
let tareas = [];
let apiKey = '';

// ─── INIT ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('fechaHoy').textContent =
    new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  apiKey = localStorage.getItem(API_KEY_KEY) || '';
  tareas = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

  if (!apiKey) {
    document.getElementById('modal-overlay').classList.add('show');
    document.getElementById('apiStatus').querySelector('.status-dot').classList.add('off');
    document.getElementById('apiStatus').querySelector('.status-label').textContent = 'Sin API key';
  }

  document.getElementById('apiStatus').addEventListener('click', () => {
    document.getElementById('modal-overlay').classList.add('show');
  });

  renderLista();
});

// ─── API KEY ────────────────────────────────────────────
function guardarKey() {
  const val = document.getElementById('apiKeyInput').value.trim();
  if (!val.startsWith('sk-')) {
    alert('La API key debe empezar por "sk-". Revísala en console.anthropic.com');
    return;
  }
  apiKey = val;
  localStorage.setItem(API_KEY_KEY, apiKey);
  document.getElementById('modal-overlay').classList.remove('show');
  document.getElementById('apiStatus').querySelector('.status-dot').classList.remove('off');
  document.getElementById('apiStatus').querySelector('.status-label').textContent = 'IA lista';
}

// ─── NAVEGACIÓN ─────────────────────────────────────────
function tab(id, btn) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('p-' + id).classList.add('active');
  if (id === 'dashboard') renderDash();
}

// ─── EJEMPLOS ───────────────────────────────────────────
function ex(i) {
  document.getElementById('txt').value = EJEMPLOS[i];
  document.getElementById('txt').focus();
}

// ─── PROCESAR CON IA ────────────────────────────────────
async function procesar() {
  const texto = document.getElementById('txt').value.trim();
  if (!texto) { document.getElementById('txt').focus(); return; }

  if (!apiKey) {
    document.getElementById('modal-overlay').classList.add('show');
    return;
  }

  const btn = document.getElementById('btnP');
  btn.disabled = true;
  document.getElementById('proc').style.display = 'flex';

  const prompt = `Eres un asistente de gestión operativa industrial. Analiza esta entrada en texto libre y extrae la información estructurada. Responde SOLO con JSON válido, sin markdown ni texto extra.

Entrada: "${texto}"

Formato exacto de respuesta:
{
  "tipo": "operativa|gestión|mejora",
  "area": "producción|logística|clientes|compras|equipo|mantenimiento|calidad|administración",
  "prioridad": "alta|media|baja",
  "accion": "descripción de max 14 palabras de lo que se hizo",
  "problema": "problema detectado en max 14 palabras, o null si no hay",
  "solucion": "solución aplicada en max 14 palabras, o null si no hay"
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Error de API');
    }

    const data = await res.json();
    const raw = data.content?.[0]?.text || '{}';
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());

    const tarea = {
      id: Date.now(),
      hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      dia: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      texto,
      ...parsed
    };

    tareas.unshift(tarea);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tareas));
    document.getElementById('txt').value = '';
    renderLista();

  } catch (e) {
    alert('Error al procesar: ' + e.message + '\n\nRevisa tu API key en el indicador superior derecho.');
  } finally {
    btn.disabled = false;
    document.getElementById('proc').style.display = 'none';
  }
}

// ─── ELIMINAR TAREA ─────────────────────────────────────
function eliminar(id) {
  if (!confirm('¿Eliminar esta entrada?')) return;
  tareas = tareas.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tareas));
  renderLista();
}

// ─── RENDER LISTA ───────────────────────────────────────
function renderLista() {
  const el = document.getElementById('lista');
  if (!tareas.length) {
    el.innerHTML = `
      <div class="empty">
        <span class="empty-icon">○</span>
        Sin entradas aún. Escribe tu primera actividad arriba.
      </div>`;
    return;
  }

  el.innerHTML = tareas.map(t => {
    const tipoClass = t.tipo === 'operativa' ? 't-op' : t.tipo === 'gestión' ? 't-gest' : 't-mej';
    const prioClass = t.prioridad === 'alta' ? 't-alta' : t.prioridad === 'media' ? 't-media' : 't-baja';
    const cardClass = t.tipo === 'gestión' ? 'gestion' : t.tipo === 'mejora' ? 'mejora' : '';
    const textoCorto = t.texto.length > 140 ? t.texto.slice(0, 140) + '…' : t.texto;

    return `
      <div class="task-card ${cardClass}">
        <div class="task-top">
          <div class="tags">
            <span class="tag ${tipoClass}">${t.tipo}</span>
            <span class="tag ${prioClass}">${t.prioridad}</span>
            ${t.area ? `<span class="tag t-area">${t.area}</span>` : ''}
          </div>
          <div class="task-meta-right">
            <span class="task-time">${t.dia} ${t.hora}</span>
            <button class="del-btn" onclick="eliminar(${t.id})" title="Eliminar">×</button>
          </div>
        </div>
        <div class="task-grid">
          <div class="tf full"><span>Acción realizada</span><p>${t.accion || '—'}</p></div>
          ${t.problema ? `<div class="tf"><span>Problema detectado</span><p>${t.problema}</p></div>` : ''}
          ${t.solucion ? `<div class="tf"><span>Solución aplicada</span><p>${t.solucion}</p></div>` : ''}
        </div>
        <div class="orig">"${textoCorto}"</div>
      </div>`;
  }).join('');
}

// ─── RENDER DASHBOARD ───────────────────────────────────
function renderDash() {
  const el = document.getElementById('dash');
  if (!tareas.length) {
    el.innerHTML = `<div class="empty"><span class="empty-icon">◻</span>Añade entradas en Captura para ver el dashboard.</div>`;
    return;
  }

  const tot = tareas.length;
  const tp = { operativa: 0, 'gestión': 0, mejora: 0 };
  const ar = {};
  const pr = { alta: 0, media: 0, baja: 0 };

  tareas.forEach(t => {
    if (tp[t.tipo] !== undefined) tp[t.tipo]++;
    ar[t.area] = (ar[t.area] || 0) + 1;
    if (pr[t.prioridad] !== undefined) pr[t.prioridad]++;
  });

  const areas = Object.entries(ar).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const barras = (items) => items.map(({ l, v, c }) => `
    <div class="brow">
      <span class="blabel">${l}</span>
      <div class="btrack">
        <div class="bfill" style="width:${tot ? Math.round(v / tot * 100) : 0}%; background:${c}"></div>
      </div>
      <span class="bval">${v}</span>
    </div>`).join('');

  el.innerHTML = `
    <div class="stats">
      <div class="stat">
        <div class="sn" style="color:var(--orange)">${tot}</div>
        <div class="sl">Entradas totales</div>
      </div>
      <div class="stat">
        <div class="sn" style="color:#E24B4A">${pr.alta}</div>
        <div class="sl">Alta prioridad</div>
      </div>
      <div class="stat">
        <div class="sn" style="color:#EF9F27">${tp.mejora}</div>
        <div class="sl">Mejoras detectadas</div>
      </div>
    </div>

    <div class="chart-box">
      <div class="ct">Distribución por tipo</div>
      ${barras([
        { l: 'Operativa', v: tp.operativa, c: 'var(--orange)' },
        { l: 'Gestión', v: tp['gestión'], c: '#378ADD' },
        { l: 'Mejora', v: tp.mejora, c: '#EF9F27' }
      ])}
    </div>

    <div class="chart-box">
      <div class="ct">Áreas más activas</div>
      ${areas.map(([a, v]) => `
        <div class="brow">
          <span class="blabel">${a}</span>
          <div class="btrack">
            <div class="bfill" style="width:${Math.round(v / tot * 100)}%; background:var(--orange)"></div>
          </div>
          <span class="bval">${v}</span>
        </div>`).join('')}
    </div>

    <div class="chart-box">
      <div class="ct">Nivel de prioridad</div>
      ${barras([
        { l: 'Alta', v: pr.alta, c: '#E24B4A' },
        { l: 'Media', v: pr.media, c: '#EF9F27' },
        { l: 'Baja', v: pr.baja, c: '#639922' }
      ])}
    </div>`;
}

// ─── GENERAR INFORME ────────────────────────────────────
async function informe() {
  if (!tareas.length) { alert('Añade entradas primero.'); return; }
  if (!apiKey) { document.getElementById('modal-overlay').classList.add('show'); return; }

  const btn = document.getElementById('btnI');
  btn.disabled = true;
  btn.textContent = 'Generando...';

  const el = document.getElementById('rout');
  el.classList.remove('placeholder');
  el.textContent = 'La Pey está redactando tu informe de valor...';

  const resumen = tareas.map(t =>
    `- [${t.tipo.toUpperCase()}][${t.area || 'general'}][${t.prioridad}] ${t.accion}` +
    `${t.problema ? ' | Problema: ' + t.problema : ''}` +
    `${t.solucion ? ' | Solución: ' + t.solucion : ''}`
  ).join('\n');

  const prompt = `Eres un consultor de operaciones industriales de alto nivel. Con este registro de trabajo, redacta un informe profesional en español para reportar a dirección. Destaca el valor real aportado, no solo las tareas ejecutadas. Tono ejecutivo, directo, sin rodeos. Máximo 400 palabras.

REGISTRO DE ACTIVIDAD:
${resumen}

Estructura el informe con estas secciones exactas (sin asteriscos ni markdown):

RESUMEN EJECUTIVO
[3-4 frases sobre qué se ha liderado, resuelto y coordinado en este período]

IMPACTO OPERATIVO
[Qué problemas concretos se han resuelto y su impacto en continuidad, costes o satisfacción del cliente]

PATRONES Y RIESGOS DETECTADOS
[Qué situaciones se repiten, qué podría convertirse en problema sistémico si no se aborda]

PROPUESTAS DE MEJORA
[2-3 acciones específicas con potencial impacto cuantificado o estimado]

VALOR APORTADO
[Párrafo directo para negociar o justificar el rol: qué aportas que no es visible en un organigrama, en qué se beneficia concretamente la empresa de tu gestión diaria]`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 900,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await res.json();
    el.textContent = data.content?.[0]?.text || 'Error al generar el informe.';
  } catch (e) {
    el.textContent = 'Error de conexión: ' + e.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Generar informe';
  }
}

// ─── COPIAR INFORME ─────────────────────────────────────
function copiar() {
  const txt = document.getElementById('rout').textContent;
  if (txt.includes('Cuando tengas')) { alert('Genera el informe primero.'); return; }
  navigator.clipboard.writeText(txt)
    .then(() => alert('Copiado al portapapeles. Listo para pegar.'))
    .catch(() => alert('No se pudo copiar automáticamente.'));
}

// ─── ENTER para enviar ──────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    const panel = document.querySelector('.panel.active');
    if (panel?.id === 'p-captura') procesar();
  }
});
