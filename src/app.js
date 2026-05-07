/* === LA PEY v3 === */
const STORAGE_KEY='lapey_tareas_v3';const API_KEY_KEY='lapey_api_key';
const EXEMPLES=["La fresadora de la línia 2 ha parat a les 9h per trencament de corretja. He contactat manteniment, han trigat 2 hores. Producció ha perdut 180 peces. He demanat estoc de recanvi.","Reunió amb proveïdor Metàl·liques García. Problemes de subministrament de xapa 3mm fins a final de mes. He tancat comanda urgent amb Aceros del Norte, 15% més car però garanteix continuïtat.","Client Automòbils Renault ha trucat urgent per retard en lot 447. Coordinat amb logística per enviament parcial avui i la resta demà. Client conforme.","Detectat que operaris perden 20 min/dia buscant eines al magatzem. Proposo sistema 5S amb panell visual. Parlat amb el cap de planta, hi està d'acord."];
let tareas=[],apiKey='',mode='text',fitxersPendents=[];

document.addEventListener('DOMContentLoaded',()=>{
  const dies=['diumenge','dilluns','dimarts','dimecres','dijous','divendres','dissabte'];
  const mesos=['gener','febrer','març','abril','maig','juny','juliol','agost','setembre','octubre','novembre','desembre'];
  const ara=new Date();
  document.getElementById('fechaHoy').textContent=`${dies[ara.getDay()]}, ${ara.getDate()} de ${mesos[ara.getMonth()]}`;
  apiKey=localStorage.getItem(API_KEY_KEY)||'';
  tareas=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
  if(apiKey){document.getElementById('apiDot').classList.add('on');document.getElementById('apiLabel').textContent='IA connectada';}
  renderLista();
});

function abrirModal(){document.getElementById('modal-overlay').classList.add('show');if(apiKey)document.getElementById('apiKeyInput').value=apiKey;}
function cerrarModal(){document.getElementById('modal-overlay').classList.remove('show');}
function guardarKey(){
  const val=document.getElementById('apiKeyInput').value.trim();
  if(!val.startsWith('sk-')){alert('La API key ha de començar per "sk-".');return;}
  apiKey=val;localStorage.setItem(API_KEY_KEY,apiKey);cerrarModal();
  document.getElementById('apiDot').classList.add('on');document.getElementById('apiLabel').textContent='IA connectada';
}

function tab(id,btn){
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');document.getElementById('p-'+id).classList.add('active');
  if(id==='dashboard')renderDash();
}

function setMode(nou,btn){
  mode=nou;
  document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const zt=document.getElementById('zoneText'),zf=document.getElementById('zoneFile');
  const zs=document.getElementById('zoneSeparator'),ze=document.getElementById('zoneTextExtra');
  const pills=document.getElementById('pills');
  if(nou==='text'){zt.style.display='block';zf.style.display='none';zs.style.display='none';ze.style.display='none';pills.style.display='flex';}
  else if(nou==='file'){zt.style.display='none';zf.style.display='block';zs.style.display='none';ze.style.display='none';pills.style.display='none';}
  else{zt.style.display='none';zf.style.display='block';zs.style.display='block';ze.style.display='block';pills.style.display='none';}
}

function dragOver(e){e.preventDefault();document.getElementById('dropZone').classList.add('drag-over');}
function dragLeave(){document.getElementById('dropZone').classList.remove('drag-over');}
function dropFile(e){e.preventDefault();document.getElementById('dropZone').classList.remove('drag-over');fileSeleccionat(e.dataTransfer.files);}
function fileSeleccionat(files){Array.from(files).forEach(f=>processarFitxer(f));}

function processarFitxer(file){
  const reader=new FileReader();
  reader.onload=(e)=>{
    const dataUrl=e.target.result;
    fitxersPendents.push({name:file.name,size:formatMida(file.size),type:file.type,dataUrl,base64:dataUrl.split(',')[1],mediaType:file.type,isImage:file.type.startsWith('image/'),isPdf:file.type==='application/pdf'});
    renderFitxerPreview();
  };
  reader.readAsDataURL(file);
}

function formatMida(b){if(b<1024)return b+' B';if(b<1048576)return Math.round(b/1024)+' KB';return (b/1048576).toFixed(1)+' MB';}

function renderFitxerPreview(){
  document.getElementById('filePreview').innerHTML=fitxersPendents.map((f,i)=>`
    <div class="file-chip">
      ${f.isImage?`<img src="${f.dataUrl}" class="file-chip-thumb" />`:`<span class="file-chip-icon">${f.isPdf?'📄':'📎'}</span>`}
      <div><div class="file-chip-name">${f.name}</div><div class="file-chip-size">${f.size}</div></div>
      <button class="file-chip-remove" onclick="eliminarFitxer(${i})">×</button>
    </div>`).join('');
}

function eliminarFitxer(i){fitxersPendents.splice(i,1);renderFitxerPreview();}

function netejar(){
  document.getElementById('txt').value='';
  const te=document.getElementById('txtExtra');if(te)te.value='';
  fitxersPendents=[];renderFitxerPreview();
}

function ex(i){document.getElementById('txt').value=EXEMPLES[i];document.getElementById('txt').focus();}

async function procesar(){
  const textoBase=document.getElementById('txt').value.trim();
  const txtEl=document.getElementById('txtExtra');
  const textoExtra=txtEl?txtEl.value.trim():'';
  const tenimFitxers=fitxersPendents.length>0;
  const tenimText=textoBase.length>0||textoExtra.length>0;
  if(!tenimFitxers&&!tenimText){document.getElementById('txt').focus();return;}
  if(!apiKey){abrirModal();return;}
  const btn=document.getElementById('btnP');
  btn.disabled=true;document.getElementById('proc').style.display='block';
  try{
    let resultats=[];
    if(tenimFitxers){
      document.getElementById('loadingText').textContent='Analitzant fitxers amb IA...';
      for(const f of fitxersPendents){
        if(f.isImage||f.isPdf){const r=await analitzarFitxer(f,textoExtra);if(r)resultats.push(r);}
      }
    }
    if(tenimText&&!tenimFitxers){
      document.getElementById('loadingText').textContent='La Pey analitza la teva entrada...';
      const r=await analitzarText(textoBase||textoExtra);if(r)resultats.push(r);
    }
    if(!resultats.length&&tenimText){
      const r=await analitzarText(textoBase||textoExtra);if(r)resultats.push(r);
    }
    for(const parsed of resultats){
      tareas.unshift({
        id:Date.now()+Math.random(),
        hora:new Date().toLocaleTimeString('ca-ES',{hour:'2-digit',minute:'2-digit'}),
        dia:new Date().toLocaleDateString('ca-ES',{day:'2-digit',month:'short'}),
        texto:textoBase||textoExtra||fitxersPendents.map(f=>f.name).join(', '),
        attachments:fitxersPendents.filter(f=>f.isImage).map(f=>({dataUrl:f.dataUrl,name:f.name})),
        docAttachments:fitxersPendents.filter(f=>!f.isImage).map(f=>({name:f.name})),
        fromFile:tenimFitxers,...parsed
      });
    }
    localStorage.setItem(STORAGE_KEY,JSON.stringify(tareas));
    netejar();renderLista();
  }catch(e){alert('Error al processar: '+e.message);}
  finally{btn.disabled=false;document.getElementById('proc').style.display='none';document.getElementById('loadingText').textContent='La Pey analitza la teva entrada...';}
}

async function analitzarFitxer(fitxer,contextExtra){
  const content=[];
  if(fitxer.isImage){content.push({type:'image',source:{type:'base64',media_type:fitxer.mediaType,data:fitxer.base64}});}
  else if(fitxer.isPdf){content.push({type:'document',source:{type:'base64',media_type:'application/pdf',data:fitxer.base64}});}
  content.push({type:'text',text:`Analitza aquest fitxer (${fitxer.name}) i extreu informació operativa.${contextExtra?' Context: "'+contextExtra+'"':''}\nRespon NOMÉS amb JSON vàlid:\n{"tipo":"operativa|gestió|millora","area":"producció|logística|clients|compres|equip|manteniment|qualitat|administració","prioridad":"alta|mitja|baixa","accion":"max 14 paraules","problema":"max 14 paraules o null","solucion":"max 14 paraules o null"}`});
  const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-5',max_tokens:400,messages:[{role:'user',content}]})});
  if(!res.ok){const err=await res.json();throw new Error(err.error?.message||'Error API');}
  const data=await res.json();
  return JSON.parse((data.content?.[0]?.text||'{}').replace(/```json|```/g,'').trim());
}

async function analitzarText(texto){
  const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-5',max_tokens:300,messages:[{role:'user',content:`Ets un assistent de gestió operativa. Analitza i respon NOMÉS amb JSON vàlid:\nEntrada: "${texto}"\n{"tipo":"operativa|gestió|millora","area":"producció|logística|clients|compres|equip|manteniment|qualitat|administració","prioridad":"alta|mitja|baixa","accion":"max 14 paraules","problema":"max 14 paraules o null","solucion":"max 14 paraules o null"}`}]})});
  const data=await res.json();
  return JSON.parse((data.content?.[0]?.text||'{}').replace(/```json|```/g,'').trim());
}

function eliminar(id){
  if(!confirm('Eliminar aquesta entrada?'))return;
  tareas=tareas.filter(t=>String(t.id)!==String(id));
  localStorage.setItem(STORAGE_KEY,JSON.stringify(tareas));renderLista();
}

function renderLista(){
  const el=document.getElementById('lista');
  if(!tareas.length){el.innerHTML=`<div class="empty"><span class="empty-symbol">✦</span><p>Sense entrades encara. Escriu, fes una foto o puja un document.</p></div>`;return;}
  el.innerHTML=tareas.map(t=>{
    const tipoClass=t.tipo==='operativa'?'t-op':t.tipo==='gestió'?'t-gest':'t-mej';
    const prioClass=t.prioridad==='alta'?'t-alta':t.prioridad==='mitja'?'t-media':'t-baja';
    const cardClass=t.tipo==='gestió'?'gestion':t.tipo==='millora'?'mejora':'';
    const txCurt=(t.texto||'').length>150?t.texto.slice(0,150)+'…':t.texto;
    const imgs=(t.attachments||[]).map(a=>`<img src="${a.dataUrl}" class="attach-thumb" title="${a.name}" onclick="window.open('${a.dataUrl}')" />`).join('');
    const docs=(t.docAttachments||[]).map(a=>`<span class="attach-doc">📎 ${a.name}</span>`).join('');
    const adj=(imgs||docs)?`<div class="task-attachments">${imgs}${docs}</div>`:'';
    const aiLbl=t.fromFile?`<span class="ai-badge">✦ analitzat per IA</span>`:'';
    return `<div class="task-card ${cardClass}">
      <div class="task-top">
        <div class="tags">
          <span class="tag ${tipoClass}">${t.tipo||'—'}</span>
          <span class="tag ${prioClass}">${t.prioridad||'—'}</span>
          ${t.area?`<span class="tag t-area">${t.area}</span>`:''}
        </div>
        <div class="task-meta-right">
          <span class="task-time">${t.dia} ${t.hora}</span>
          <button class="del-btn" onclick="eliminar('${t.id}')">×</button>
        </div>
      </div>
      <div class="task-grid">
        <div class="tf full"><span class="tf-label">Acció realitzada</span><p>${t.accion||'—'}</p></div>
        ${t.problema?`<div class="tf"><span class="tf-label">Problema detectat</span><p>${t.problema}</p></div>`:''}
        ${t.solucion?`<div class="tf"><span class="tf-label">Solució aplicada</span><p>${t.solucion}</p></div>`:''}
      </div>
      ${adj}${aiLbl}
      <div class="orig">"${txCurt}"</div>
    </div>`;
  }).join('');
}

function renderDash(){
  const el=document.getElementById('dash');
  if(!tareas.length){el.innerHTML=`<div class="empty"><span class="empty-symbol">◈</span><p>Afegeix entrades per veure el dashboard.</p></div>`;return;}
  const tot=tareas.length,tp={operativa:0,'gestió':0,millora:0},ar={},pr={alta:0,mitja:0,baixa:0};
  let ambF=0;
  tareas.forEach(t=>{if(tp[t.tipo]!==undefined)tp[t.tipo]++;if(t.area)ar[t.area]=(ar[t.area]||0)+1;if(pr[t.prioridad]!==undefined)pr[t.prioridad]++;if(t.fromFile)ambF++;});
  const areas=Object.entries(ar).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const barres=(items)=>items.map(({l,v,c})=>`<div class="brow"><span class="blabel">${l}</span><div class="btrack"><div class="bfill" style="width:${tot?Math.round(v/tot*100):0}%;background:${c}"></div></div><span class="bval">${v}</span></div>`).join('');
  el.innerHTML=`
    <div class="dash-hero"><h2 class="dash-title">El teu panell</h2><p class="dash-sub">Resum visual de la teva activitat</p></div>
    <div class="stats">
      <div class="stat"><div class="stat-num" style="color:var(--orange)">${tot}</div><div class="stat-label">Entrades totals</div></div>
      <div class="stat"><div class="stat-num" style="color:var(--red)">${pr.alta}</div><div class="stat-label">Alta prioritat</div></div>
      <div class="stat"><div class="stat-num" style="color:var(--amber)">${ambF}</div><div class="stat-label">Amb fitxers</div></div>
    </div>
    <div class="chart-section"><div class="chart-title">Per tipus</div>${barres([{l:'Operativa',v:tp.operativa,c:'var(--orange)'},{l:'Gestió',v:tp['gestió'],c:'var(--blue)'},{l:'Millora',v:tp.millora,c:'#D97706'}])}</div>
    ${areas.length?`<div class="chart-section"><div class="chart-title">Àrees més actives</div>${areas.map(([a,v])=>`<div class="brow"><span class="blabel">${a}</span><div class="btrack"><div class="bfill" style="width:${Math.round(v/tot*100)}%;background:var(--orange)"></div></div><span class="bval">${v}</span></div>`).join('')}</div>`:''}
    <div class="chart-section"><div class="chart-title">Prioritat</div>${barres([{l:'Alta',v:pr.alta,c:'var(--red)'},{l:'Mitja',v:pr.mitja,c:'#D97706'},{l:'Baixa',v:pr.baixa,c:'var(--success)'}])}</div>`;
}

async function informe(){
  if(!tareas.length){alert('Afegeix entrades primer.');return;}
  if(!apiKey){abrirModal();return;}
  const btn=document.getElementById('btnI');btn.disabled=true;btn.innerHTML='<span class="btn-spark">❋</span> Generant...';
  const el=document.getElementById('rout');el.classList.remove('placeholder');el.textContent='La Pey està redactant el teu informe de valor...';
  const resum=tareas.map(t=>`- [${(t.tipo||'').toUpperCase()}][${t.area||'general'}][${t.prioridad}] ${t.accion}${t.problema?' | Problema: '+t.problema:''}${t.solucion?' | Solució: '+t.solucion:''}${t.fromFile?' [fitxer]':''}`).join('\n');
  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-5',max_tokens:900,messages:[{role:'user',content:`Ets un consultor d'operacions industrials. Redacta un informe professional en espanyol. To executiu, directe. Màxim 400 paraules.\n\nREGISTRE:\n${resum}\n\nSeccions exactes (sense markdown):\n\nRESUMEN EJECUTIVO\nIMPACTO OPERATIVO\nPATRONES Y RIESGOS DETECTADOS\nPROPUESTAS DE MEJORA\nVALOR APORTADO`}]})});
    const data=await res.json();el.textContent=data.content?.[0]?.text||'Error.';
  }catch(e){el.textContent='Error: '+e.message;}
  finally{btn.disabled=false;btn.innerHTML='<span class="btn-spark">❋</span> Generar informe';}
}

function copiar(){
  const txt=document.getElementById('rout').textContent;
  if(txt.includes('Quan tinguis')){alert('Genera l\'informe primer.');return;}
  navigator.clipboard.writeText(txt).then(()=>alert('Copiat!')).catch(()=>alert('No s\'ha pogut copiar.'));
}

document.addEventListener('keydown',(e)=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)&&document.getElementById('p-captura').classList.contains('active'))procesar();});
