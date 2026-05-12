const STORAGE_KEY='lapey_tareas_v3',API_KEY_KEY='lapey_api_key';
const EXEMPLES=["La fresadora de la línia 2 ha parat a les 9h per trencament de corretja. He contactat manteniment, han trigat 2 hores. Producció ha perdut 180 peces.","Reunió amb proveïdor Metàl·liques García. Problemes de subministrament de xapa 3mm. He tancat comanda urgent amb Aceros del Norte.","Client Automòbils Renault ha trucat urgent per retard en lot 447. Coordinat amb logística per enviament parcial avui.","Detectat que operaris perden 20 min/dia buscant eines. Proposo sistema 5S amb panell visual."];
let tareas=[],apiKey='',mode='text',fitxersPendents=[];

document.addEventListener('DOMContentLoaded',()=>{
  const dies=['diumenge','dilluns','dimarts','dimecres','dijous','divendres','dissabte'],mesos=['gener','febrer','març','abril','maig','juny','juliol','agost','setembre','octubre','novembre','desembre'],ara=new Date();
  document.getElementById('fechaHoy').textContent=`${dies[ara.getDay()]}, ${ara.getDate()} de ${mesos[ara.getMonth()]}`;
  apiKey=localStorage.getItem(API_KEY_KEY)||'';
  tareas=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
  // Migrar entrades antigues sense diaKey
  tareas=tareas.map(t=>{if(!t.diaKey&&t.timestamp)t.diaKey=t.timestamp.split('T')[0];return t;});
  if(apiKey){document.getElementById('apiDot').classList.add('on');document.getElementById('apiLabel').textContent='IA connectada';}
  renderLista();
});

function abrirModal(){document.getElementById('modal-overlay').classList.add('show');if(apiKey)document.getElementById('apiKeyInput').value=apiKey;}
function cerrarModal(){document.getElementById('modal-overlay').classList.remove('show');}
function guardarKey(){const val=document.getElementById('apiKeyInput').value.trim();if(!val.startsWith('sk-')){alert('La API key ha de començar per "sk-".');return;}apiKey=val;localStorage.setItem(API_KEY_KEY,apiKey);cerrarModal();document.getElementById('apiDot').classList.add('on');document.getElementById('apiLabel').textContent='IA connectada';}

function tab(id,btn){document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));btn.classList.add('active');document.getElementById('p-'+id).classList.add('active');if(id==='dashboard')renderDash();if(id==='historial')renderHistorial();}

function setMode(nou,btn){mode=nou;document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const zt=document.getElementById('zoneText'),zf=document.getElementById('zoneFile'),zs=document.getElementById('zoneSeparator'),ze=document.getElementById('zoneTextExtra');if(nou==='text'){zt.style.display='block';zf.style.display='none';zs.style.display='none';ze.style.display='none';}else if(nou==='file'){zt.style.display='none';zf.style.display='block';zs.style.display='none';ze.style.display='none';}else{zt.style.display='none';zf.style.display='block';zs.style.display='block';ze.style.display='block';}}

function dragOver(e){e.preventDefault();document.getElementById('dropZone').classList.add('drag-over');}
function dragLeave(){document.getElementById('dropZone').classList.remove('drag-over');}
function dropFile(e){e.preventDefault();document.getElementById('dropZone').classList.remove('drag-over');fileSeleccionat(e.dataTransfer.files);}
function fileSeleccionat(files){Array.from(files).forEach(f=>processarFitxer(f));}
function processarFitxer(file){const reader=new FileReader();reader.onload=(e)=>{const dataUrl=e.target.result;const isImage=file.type.startsWith('image/');if(isImage){const img=new Image();img.onload=()=>{const canvas=document.createElement('canvas');const MAX=1024;let w=img.width,h=img.height;if(w>MAX||h>MAX){if(w>h){h=Math.round(h*MAX/w);w=MAX;}else{w=Math.round(w*MAX/h);h=MAX;}}canvas.width=w;canvas.height=h;canvas.getContext('2d').drawImage(img,0,0,w,h);const compressedUrl=canvas.toDataURL('image/jpeg',0.7);fitxersPendents.push({name:file.name,size:formatMida(file.size),type:'image/jpeg',dataUrl:compressedUrl,base64:compressedUrl.split(',')[1],mediaType:'image/jpeg',isImage:true,isPdf:false});renderFitxerPreview();};img.src=dataUrl;}else{fitxersPendents.push({name:file.name,size:formatMida(file.size),type:file.type,dataUrl,base64:dataUrl.split(',')[1],mediaType:file.type,isImage:false,isPdf:file.type==='application/pdf'});renderFitxerPreview();}};reader.readAsDataURL(file);}
function formatMida(b){if(b<1024)return b+' B';if(b<1048576)return Math.round(b/1024)+' KB';return(b/1048576).toFixed(1)+' MB';}
function renderFitxerPreview(){document.getElementById('filePreview').innerHTML=fitxersPendents.map((f,i)=>`<div class="file-chip">${f.isImage?`<img src="${f.dataUrl}" class="file-chip-thumb" />`:`<span class="file-chip-icon">${f.isPdf?'📄':'📎'}</span>`}<div><div class="file-chip-name">${f.name}</div><div class="file-chip-size">${f.size}</div></div><button class="file-chip-remove" onclick="eliminarFitxer(${i})">×</button></div>`).join('');}
function eliminarFitxer(i){fitxersPendents.splice(i,1);renderFitxerPreview();}
function netejar(){document.getElementById('txt').value='';const te=document.getElementById('txtExtra');if(te)te.value='';fitxersPendents=[];renderFitxerPreview();}
function ex(i){document.getElementById('txt').value=EXEMPLES[i];document.getElementById('txt').focus();}

async function procesar(){
  const textoBase=document.getElementById('txt').value.trim(),txtEl=document.getElementById('txtExtra'),textoExtra=txtEl?txtEl.value.trim():'',tenimFitxers=fitxersPendents.length>0,tenimText=textoBase.length>0||textoExtra.length>0;
  if(!tenimFitxers&&!tenimText){document.getElementById('txt').focus();return;}
  if(!apiKey){abrirModal();return;}
  const btn=document.getElementById('btnP');btn.disabled=true;document.getElementById('proc').style.display='block';
  try{
    let resultats=[];
    if(tenimFitxers){document.getElementById('loadingText').textContent='Analitzant fitxers amb IA...';for(const f of fitxersPendents){if(f.isImage||f.isPdf){const r=await analitzarFitxer(f,textoExtra);if(r)resultats.push(r);}}}
    if(tenimText&&!tenimFitxers){document.getElementById('loadingText').textContent='La Pey analitza la teva entrada...';const r=await analitzarText(textoBase||textoExtra);if(r)resultats.push(r);}
    if(!resultats.length&&tenimText){const r=await analitzarText(textoBase||textoExtra);if(r)resultats.push(r);}
    const ara=new Date();
    for(const parsed of resultats){tareas.unshift({id:Date.now()+Math.random(),timestamp:ara.toISOString(),hora:ara.toLocaleTimeString('ca-ES',{hour:'2-digit',minute:'2-digit'}),dia:ara.toLocaleDateString('ca-ES',{day:'2-digit',month:'short'}),diaKey:ara.toISOString().split('T')[0],texto:textoBase||textoExtra||fitxersPendents.map(f=>f.name).join(', '),attachments:fitxersPendents.filter(f=>f.isImage).map(f=>({dataUrl:f.dataUrl,name:f.name})),docAttachments:fitxersPendents.filter(f=>!f.isImage).map(f=>({name:f.name})),fromFile:tenimFitxers,...parsed});}
    localStorage.setItem(STORAGE_KEY,JSON.stringify(tareas));netejar();renderLista();
  }catch(e){alert('Error al processar: '+e.message);}
  finally{btn.disabled=false;document.getElementById('proc').style.display='none';document.getElementById('loadingText').textContent='La Pey analitza la teva entrada...';}
}

async function analitzarFitxer(fitxer,contextExtra){
  const content=[];
  if(fitxer.isImage)content.push({type:'image',source:{type:'base64',media_type:fitxer.mediaType,data:fitxer.base64}});
  else if(fitxer.isPdf)content.push({type:'document',source:{type:'base64',media_type:'application/pdf',data:fitxer.base64}});
  content.push({type:'text',text:`Analitza aquest fitxer (${fitxer.name}) i extreu informació operativa.${contextExtra?' Context: "'+contextExtra+'"':''}\nRespon NOMÉS amb JSON vàlid:\n{"tipo":"operativa|gestió|millora","area":"producció|logística|clients|compres|equip|manteniment|qualitat|administració","prioridad":"alta|mitja|baixa","accion":"max 14 paraules","problema":"max 14 paraules o null","solucion":"max 14 paraules o null"}`});
  const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:400,messages:[{role:'user',content}]})});
  if(!res.ok){const err=await res.json();throw new Error(err.error?.message||'Error API');}
  const data=await res.json();
  return JSON.parse((data.content?.[0]?.text||'{}').replace(/```json|```/g,'').trim());
}

async function analitzarText(texto){
  const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:300,messages:[{role:'user',content:`Ets un assistent de gestió operativa. Analitza i respon NOMÉS amb JSON vàlid:\nEntrada: "${texto}"\n{"tipo":"operativa|gestió|millora","area":"producció|logística|clients|compres|equip|manteniment|qualitat|administració","prioridad":"alta|mitja|baixa","accion":"max 14 paraules","problema":"max 14 paraules o null","solucion":"max 14 paraules o null"}`}]})});
  const data=await res.json();
  return JSON.parse((data.content?.[0]?.text||'{}').replace(/```json|```/g,'').trim());
}

function eliminar(id){if(!confirm('Eliminar aquesta entrada?'))return;tareas=tareas.filter(t=>String(t.id)!==String(id));localStorage.setItem(STORAGE_KEY,JSON.stringify(tareas));renderLista();if(document.getElementById('p-historial').classList.contains('active'))renderHistorial();}

function renderLista(){
  const el=document.getElementById('lista'),avui=new Date().toISOString().split('T')[0],avuiTareas=tareas.filter(t=>t.diaKey===avui);
  if(!avuiTareas.length){el.innerHTML=`<div class="empty"><span class="empty-symbol">✦</span><p>Sense entrades avui. Escriu la teva primera activitat del dia.</p></div>`;return;}
  el.innerHTML=`<div class="hist-day-label">Avui — ${avuiTareas.length} entrada${avuiTareas.length>1?'es':''}</div>`+avuiTareas.map(t=>renderCard(t)).join('');
}

function renderCard(t){
  const tipoClass=t.tipo==='operativa'?'t-op':t.tipo==='gestió'?'t-gest':'t-mej',prioClass=t.prioridad==='alta'?'t-alta':t.prioridad==='mitja'?'t-media':'t-baja',cardClass=t.tipo==='gestió'?'gestion':t.tipo==='millora'?'mejora':'',txCurt=(t.texto||'').length>150?t.texto.slice(0,150)+'…':t.texto;
  const imgs=(t.attachments||[]).map(a=>`<img src="${a.dataUrl}" class="attach-thumb" onclick="window.open('${a.dataUrl}')" />`).join('');
  const docs=(t.docAttachments||[]).map(a=>`<span class="attach-doc">📎 ${a.name}</span>`).join('');
  return `<div class="task-card ${cardClass}"><div class="task-top"><div class="tags"><span class="tag ${tipoClass}">${t.tipo||'—'}</span><span class="tag ${prioClass}">${t.prioridad||'—'}</span>${t.area?`<span class="tag t-area">${t.area}</span>`:''}</div><div class="task-meta-right"><span class="task-time">${t.dia} ${t.hora}</span><button class="del-btn" onclick="eliminar('${t.id}')">×</button></div></div><div class="task-grid"><div class="tf full"><span class="tf-label">Acció realitzada</span><p>${t.accion||'—'}</p></div>${t.problema?`<div class="tf"><span class="tf-label">Problema detectat</span><p>${t.problema}</p></div>`:''}${t.solucion?`<div class="tf"><span class="tf-label">Solució aplicada</span><p>${t.solucion}</p></div>`:''}</div>${(imgs||docs)?`<div class="task-attachments">${imgs}${docs}</div>`:''}${t.fromFile?`<span class="ai-badge">✦ analitzat per IA</span>`:''}<div class="orig">"${txCurt}"</div></div>`;
}

function renderHistorial(){
  const cerca=(document.getElementById('searchInput')?.value||'').toLowerCase(),periode=document.getElementById('filterPeriode')?.value||'tot',tipus=document.getElementById('filterTipus')?.value||'',area=document.getElementById('filterArea')?.value||'',prio=document.getElementById('filterPrio')?.value||'';
  const ara=new Date(),avui=ara.toISOString().split('T')[0];
  const dilluns=new Date(ara);dilluns.setDate(ara.getDate()-ara.getDay()+1);
  const dillunsKey=dilluns.toISOString().split('T')[0],mesKey=avui.slice(0,7);
  let filtrades=tareas.filter(t=>{
    if(periode==='avui'&&t.diaKey!==avui)return false;
    if(periode==='setmana'&&t.diaKey<dillunsKey)return false;
    if(periode==='mes'&&(!t.diaKey||t.diaKey.slice(0,7)!==mesKey))return false;
    if(tipus&&t.tipo!==tipus)return false;
    if(area&&t.area!==area)return false;
    if(prio&&t.prioridad!==prio)return false;
    if(cerca&&!(t.accion||'').toLowerCase().includes(cerca)&&!(t.texto||'').toLowerCase().includes(cerca)&&!(t.area||'').toLowerCase().includes(cerca))return false;
    return true;
  });
  const statsEl=document.getElementById('histStats');
  if(statsEl)statsEl.innerHTML=`<span class="hist-stat-pill"><strong>${filtrades.length}</strong> entrades</span><span class="hist-stat-pill"><strong>${filtrades.filter(t=>t.prioridad==='alta').length}</strong> urgents</span><span class="hist-stat-pill"><strong>${filtrades.filter(t=>t.fromFile).length}</strong> amb fitxers</span>`;
  const el=document.getElementById('historialTable');
  if(!filtrades.length){el.innerHTML=`<div class="hist-empty">Cap entrada amb els filtres seleccionats.</div>`;return;}
  const perDia={};filtrades.forEach(t=>{const k=t.diaKey||'x';if(!perDia[k])perDia[k]=[];perDia[k].push(t);});
  el.innerHTML=Object.keys(perDia).sort((a,b)=>b.localeCompare(a)).map(dia=>{
    const etiqueta=formatDiaLabel(dia);
    const files=perDia[dia].map(t=>{
      const tc=t.tipo==='operativa'?'t-op':t.tipo==='gestió'?'t-gest':'t-mej',pc=t.prioridad==='alta'?'t-alta':t.prioridad==='mitja'?'t-media':'t-baja';
      return `<div class="hist-row"><span class="hist-date">${t.hora||''}</span><div class="hist-accio"><div>${t.accion||'—'}</div><div class="hist-orig">${(t.texto||'').slice(0,80)}</div></div><span class="tag ${tc}" style="font-size:11px">${t.tipo||'—'}</span><span class="tag ${pc}" style="font-size:11px">${t.prioridad||'—'}</span><span class="tag t-area" style="font-size:11px">${t.area||'—'}</span><button class="hist-del" onclick="eliminar('${t.id}')">×</button></div>`;
    }).join('');
    return `<div class="hist-day-group"><div class="hist-day-label">${etiqueta} — ${perDia[dia].length} entrada${perDia[dia].length>1?'es':''}</div><div class="hist-table"><div class="hist-table-header"><span>Hora</span><span>Acció</span><span>Tipus</span><span>Prioritat</span><span>Àrea</span><span></span></div>${files}</div></div>`;
  }).join('');
}

function formatDiaLabel(k){if(!k||k==='x')return 'Sense data';const avui=new Date().toISOString().split('T')[0],ahir=new Date(Date.now()-86400000).toISOString().split('T')[0];if(k===avui)return 'Avui';if(k===ahir)return 'Ahir';const d=new Date(k+'T12:00:00');return d.toLocaleDateString('ca-ES',{weekday:'long',day:'numeric',month:'long'});}

function renderDash(){
  const el=document.getElementById('dash');
  if(!tareas.length){el.innerHTML=`<div class="empty"><span class="empty-symbol">◈</span><p>Afegeix entrades per veure el dashboard.</p></div>`;return;}
  const tot=tareas.length,tp={operativa:0,'gestió':0,millora:0},ar={},pr={alta:0,mitja:0,baixa:0},perDia={};
  tareas.forEach(t=>{if(tp[t.tipo]!==undefined)tp[t.tipo]++;if(t.area)ar[t.area]=(ar[t.area]||0)+1;if(pr[t.prioridad]!==undefined)pr[t.prioridad]++;const k=t.diaKey||'x';perDia[k]=(perDia[k]||0)+1;});
  const areas=Object.entries(ar).sort((a,b)=>b[1]-a[1]).slice(0,6);
  el.innerHTML=`
    <div class="dash-hero"><h2 class="dash-title">El teu panell</h2><p class="dash-sub">Resum visual de tota la teva activitat</p></div>
    <div class="stats">
      <div class="stat"><div class="stat-num" style="color:var(--green)">${tot}</div><div class="stat-label">Entrades totals</div></div>
      <div class="stat"><div class="stat-num" style="color:var(--red)">${pr.alta}</div><div class="stat-label">Alta prioritat</div></div>
      <div class="stat"><div class="stat-num" style="color:var(--orange)">${tp.millora}</div><div class="stat-label">Millores</div></div>
    </div>
    <div class="dash-grid">
      <div class="dash-card"><div class="dash-card-title">Per tipus de tasca</div>${generarDonut([{label:'Operativa',val:tp.operativa,color:'#1C4A47'},{label:'Gestió',val:tp['gestió'],color:'#3D8EC9'},{label:'Millora',val:tp.millora,color:'#E8521A'}],tot)}</div>
      <div class="dash-card"><div class="dash-card-title">Per prioritat</div>${generarDonut([{label:'Alta',val:pr.alta,color:'#B91C1C'},{label:'Mitja',val:pr.mitja,color:'#B45309'},{label:'Baixa',val:pr.baixa,color:'#15803D'}],tot)}</div>
      <div class="dash-card full"><div class="dash-card-title">Àrees més actives</div><div class="bar-chart">${areas.map(([a,v])=>`<div class="bar-item"><div class="bar-top"><span class="bar-name">${a}</span><span class="bar-num">${v}</span></div><div class="bar-track"><div class="bar-fill" style="width:${Math.round(v/tot*100)}%;background:var(--green)"></div></div></div>`).join('')}</div></div>
      <div class="dash-card full"><div class="dash-card-title">Activitat últims 28 dies</div>${generarActivitat(perDia)}</div>
    </div>`;
}

function generarDonut(items,total){
  if(!total)return '<p style="color:var(--muted);font-size:13px">Sense dades</p>';
  const r=54,cx=64,cy=64,stroke=18,circ=2*Math.PI*r;let offset=0,segments='';
  items.forEach(item=>{const pct=total?item.val/total:0,dash=pct*circ;segments+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${item.color}" stroke-width="${stroke}" stroke-dasharray="${dash} ${circ-dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})" opacity="${item.val?1:0.15}" />`;offset+=dash;});
  return `<div class="donut-wrap"><svg class="donut-svg" width="128" height="128" viewBox="0 0 128 128"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--bg)" stroke-width="${stroke}" />${segments}<text x="${cx}" y="${cy+8}" text-anchor="middle" font-family="Fraunces,serif" font-size="26" fill="var(--ink)" font-weight="600">${total}</text></svg><div class="donut-legend">${items.map(item=>`<div class="donut-item"><div class="donut-dot" style="background:${item.color}"></div><span class="donut-label">${item.label}</span><span class="donut-val">${item.val}</span></div>`).join('')}</div></div>`;
}

function generarActivitat(perDia){
  const dies=[];
  for(let i=27;i>=0;i--){const d=new Date(Date.now()-i*86400000),k=d.toISOString().split('T')[0],n=perDia[k]||0,cls=n===0?'':n===1?'has-1':n<=3?'has-2':'has-3',avui=new Date().toISOString().split('T')[0];dies.push(`<div class="activity-day ${cls}${k===avui?' today':''}" title="${k}: ${n} entrades">${n||''}</div>`);}
  const setmanes=[];for(let i=0;i<dies.length;i+=7)setmanes.push(`<div class="activity-week">${dies.slice(i,i+7).join('')}</div>`);
  return `<div class="activity-grid">${setmanes.join('')}</div><div style="display:flex;gap:6px;margin-top:10px;align-items:center;font-size:11px;color:var(--muted)"><span>Menys</span><div class="activity-day" style="width:18px;height:18px"></div><div class="activity-day has-1" style="width:18px;height:18px"></div><div class="activity-day has-2" style="width:18px;height:18px"></div><div class="activity-day has-3" style="width:18px;height:18px"></div><span>Més</span></div>`;
}

async function informe(){
  if(!tareas.length){alert('Afegeix entrades primer.');return;}
  if(!apiKey){abrirModal();return;}
  const periode=document.getElementById('informePeriode')?.value||'setmana',ara=new Date(),avui=ara.toISOString().split('T')[0];
  const dilluns=new Date(ara);dilluns.setDate(ara.getDate()-ara.getDay()+1);
  const dillunsKey=dilluns.toISOString().split('T')[0],mesKey=avui.slice(0,7);
  let filtrades=tareas;
  if(periode==='setmana')filtrades=tareas.filter(t=>t.diaKey>=dillunsKey);
  else if(periode==='mes')filtrades=tareas.filter(t=>(t.diaKey||'').slice(0,7)===mesKey);
  if(!filtrades.length){alert('No hi ha entrades per al període seleccionat.');return;}
  const btn=document.getElementById('btnI');btn.disabled=true;btn.innerHTML='<span class="btn-spark">❋</span> Generant...';
  const el=document.getElementById('rout');el.classList.remove('placeholder');el.textContent='La Pey està redactant el teu informe de valor...';
  const resum=filtrades.map(t=>`- [${(t.tipo||'').toUpperCase()}][${t.area||'general'}][${t.prioridad}] ${t.accion}${t.problema?' | Problema: '+t.problema:''}${t.solucion?' | Solució: '+t.solucion:''}${t.fromFile?' [fitxer]':''}`).join('\n');
  const etPeriode=periode==='setmana'?'aquesta setmana':periode==='mes'?'aquest mes':'tot el període';
  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:900,messages:[{role:'user',content:`Ets un consultor d'operacions industrials. Redacta un informe professional en espanyol per ${etPeriode}. To executiu, directe. Màxim 400 paraules.\n\nREGISTRE:\n${resum}\n\nSeccions (sense markdown):\n\nRESUMEN EJECUTIVO\nIMPACTO OPERATIVO\nPATRONES Y RIESGOS DETECTADOS\nPROPUESTAS DE MEJORA\nVALOR APORTADO`}]})});
    const data=await res.json();el.textContent=data.content?.[0]?.text||'Error.';
  }catch(e){el.textContent='Error: '+e.message;}
  finally{btn.disabled=false;btn.innerHTML='<span class="btn-spark">❋</span> Generar';}
}

function copiar(){const txt=document.getElementById('rout').textContent;if(txt.includes('Quan tinguis')){alert('Genera l\'informe primer.');return;}navigator.clipboard.writeText(txt).then(()=>alert('Copiat!')).catch(()=>alert('No s\'ha pogut copiar.'));}
document.addEventListener('keydown',(e)=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)&&document.getElementById('p-captura').classList.contains('active'))procesar();});

function exportarDades(){const dades=localStorage.getItem(STORAGE_KEY)||'[]';const blob=new Blob([dades],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='lapey-dades-'+new Date().toISOString().split('T')[0]+'.json';a.click();URL.revokeObjectURL(url);}
function importarDades(input){const file=input.files[0];if(!file)return;const reader=new FileReader();reader.onload=(e)=>{try{const dades=JSON.parse(e.target.result);if(!Array.isArray(dades))throw new Error('Format incorrecte');const actuals=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');const ids=new Set(actuals.map(t=>t.id));const noves=dades.filter(t=>!ids.has(t.id));tareas=[...actuals,...noves];localStorage.setItem(STORAGE_KEY,JSON.stringify(tareas));renderLista();renderHistorial();alert('Importat correctament! '+noves.length+' entrades noves afegides.');}catch(err){alert('Error al importar: '+err.message);}};reader.readAsText(file);input.value='';}
