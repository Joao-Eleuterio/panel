(function(){
'use strict';

const WO_PLAN={
  joao:[
    {id:'d1',day:'Dia 1',name:'Peito + Ombros + Bíceps',ex:[
      ['Supino reto',3,'6–10'],['Supino inclinado',3,'8–12'],['Crucifixo / Flyes',3,'10–15'],
      ['Elevação lateral',3,'12–20'],['Desenvolvimento de ombros máquina',3,'8–12'],
      ['Rosca martelo',3,'8–12'],['Bíceps curl com halteres',3,'10–15']]},
    {id:'d2',day:'Dia 2',name:'Pernas + Abdominais',ex:[
      ['Agachamento',3,'6–10'],['Leg Press',3,'8–12'],['Cadeira extensora',3,'10–15'],
      ['Leg Curl',3,'10–15'],['Gémeos na Leg Press',3,'12–20'],['Cable Crunch',3,'10–15'],
      ['Elevação de pernas / joelhos',3,'10–15']]},
    {id:'d3',day:'Dia 3',name:'Costas + Tríceps',ex:[
      ['Puxada alta na polia',3,'8–12'],['Remada baixa máquina',3,'8–12'],['Barra fixa',3,'6–10'],
      ['Tríceps na polia',3,'10–15'],['Tríceps francês com halter',3,'10–15']]},
    {id:'d4',day:'Dia 4',name:'Pesado + Full Body',ex:[
      ['Leg Press',3,'6–8'],['Desenvolvimento de ombros máquina',3,'6–8'],['Remada baixa máquina',3,'6–8'],
      ['Barra fixa',3,'6–8'],['Crucifixo / Flyes',3,'10–15'],['Bíceps curl',3,'8–12'],['Tríceps na polia',3,'8–12']]}
  ],
  namorada:[
    {id:'d1',day:'Dia 1',name:'Peito + Ombros + Bíceps',ex:[
      ['Supino reto',3,'6–10'],['Supino inclinado',3,'8–12'],['Crucifixo / Flyes',3,'10–15'],
      ['Elevação lateral',3,'12–20'],['Desenvolvimento de ombros máquina',3,'8–12'],
      ['Rosca martelo',3,'8–12'],['Bíceps curl com halteres',3,'10–15']]},
    {id:'d2',day:'Dia 2',name:'Pernas + Abdominais',ex:[
      ['Agachamento',3,'6–10'],['Leg Press',3,'8–12'],['Cadeira extensora',3,'10–15'],
      ['Leg Curl',3,'10–15'],['Gémeos na Leg Press',3,'12–20'],['Cable Crunch',3,'10–15'],
      ['Elevação de pernas / joelhos',3,'10–15']]},
    {id:'d3',day:'Dia 3',name:'Costas + Tríceps',ex:[
      ['Puxada alta na polia',3,'8–12'],['Remada baixa máquina',3,'8–12'],['Barra fixa',3,'6–10'],
      ['Tríceps na polia',3,'10–15'],['Tríceps francês com halter',3,'10–15']]},
    {id:'d4',day:'Dia 4',name:'Glúteos',ex:[
      ['Hip Thrust',4,'6–10'],['Búlgaro',3,'8–12 / perna'],['Stiff / Romanian Deadlift',3,'8–12'],
      ['Cadeira abdutora',3,'12–20'],['Glute Kickback',3,'12–20 / perna']]}
  ]
};

let wo={person:'joao',tab:'plan',session:null};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const personName=p=>p==='namorada'?'Namorada':'João';
const today=()=>new Date().toISOString().slice(0,10);

async function rows(){
  if(typeof window.dbAll!=='function') return [];
  return (await window.dbAll()).filter(x=>!x.deleted&&x.type==='Workout');
}
function parseRow(r){try{return JSON.parse(r.notes||'{}')}catch{return {}}}
async function history(person=wo.person){
  return (await rows()).map(r=>({row:r,data:parseRow(r)})).filter(x=>x.data.person===person).sort((a,b)=>(b.row.due||'').localeCompare(a.row.due||'')||(+b.row.updatedAt||0)-(+a.row.updatedAt||0));
}
async function previous(person,dayId){return (await history(person)).find(x=>x.data.dayId===dayId)}
function fmtDate(iso){if(!iso)return '';const [y,m,d]=iso.split('-');return `${d}/${m}/${y}`}
function volumeOf(d){let v=0;for(const e of d.exercises||[])for(const s of e.sets||[]){const kg=+s.kg,reps=+s.reps;if(kg>0&&reps>0)v+=kg*reps}return v}
function setSummary(e){return (e.sets||[]).filter(s=>s.kg||s.reps).map((s,i)=>`${i+1}: ${s.kg||'—'} kg × ${s.reps||'—'}`).join(' · ')||'Sem séries registadas'}

function chrome(title,sub){
  document.querySelector('#viewTitle').textContent=title;
  document.querySelector('#viewSub').textContent=sub;
  ['#homeSwitch','#search','#chipArea','#chipType','#chipStatus'].forEach(s=>{const x=document.querySelector(s);if(x)x.style.display='none'});
  const f=document.querySelector('#fab');if(f)f.style.display='none';
}
function shell(body){return `<div class="workout"><div class="wo-people"><button data-wo-person="joao" class="${wo.person==='joao'?'on':''}">João</button><button data-wo-person="namorada" class="${wo.person==='namorada'?'on':''}">Namorada</button></div><div class="wo-tabs"><button data-wo-tab="plan" class="${wo.tab==='plan'?'on':''}">Plano</button><button data-wo-tab="history" class="${wo.tab==='history'?'on':''}">Histórico</button></div>${body}</div>`}

async function renderWorkout(){
  chrome('Treino','Hipertrofia · registo de cargas e repetições');
  const list=document.querySelector('#list');
  if(wo.session) return renderSession(list);
  if(wo.tab==='history') return renderHistory(list);
  const h=await history();
  const count=h.length,last=h[0];
  const cards=WO_PLAN[wo.person].map(d=>`<div class="wo-card" data-wo-day="${d.id}"><div class="wo-day">${d.day}</div><h3>${esc(d.name)}</h3><div class="wo-muted">${d.ex.length} exercícios · tocar para registar</div></div>`).join('');
  list.innerHTML=shell(`<div class="wo-kpis"><div class="wo-kpi"><small>Treinos</small><b>${count}</b></div><div class="wo-kpi"><small>Último</small><b>${last?fmtDate(last.row.due):'—'}</b></div><div class="wo-kpi"><small>Pessoa</small><b style="font-size:14px">${personName(wo.person)}</b></div></div><div class="wo-grid">${cards}</div><div class="wo-muted" style="margin-top:12px">Nos exercícios compostos mantém normalmente 1–2 repetições em reserva. Aumenta a carga quando atingires o topo da gama de repetições com boa técnica.</div>`);
  bindCommon(list);
  list.querySelectorAll('[data-wo-day]').forEach(b=>b.onclick=()=>{wo.session=b.dataset.woDay;renderWorkout()});
}

async function renderSession(list){
  const plan=WO_PLAN[wo.person].find(x=>x.id===wo.session);if(!plan){wo.session=null;return renderWorkout()}
  const prev=await previous(wo.person,plan.id);
  const pex=prev?.data?.exercises||[];
  const ex=plan.ex.map(([name,sets,target],i)=>{
    const old=pex.find(x=>x.name===name)||pex[i];
    const setRows=Array.from({length:sets},(_,j)=>`<div class="wo-set"><span>S${j+1}</span><input type="number" min="0" step="0.5" inputmode="decimal" data-kg="${i}-${j}" placeholder="kg"><input type="number" min="0" step="1" inputmode="numeric" data-reps="${i}-${j}" placeholder="reps"></div>`).join('');
    return `<div class="wo-ex"><div class="wo-ex-head"><div><div class="wo-ex-name">${esc(name)}</div></div><div class="wo-target">${sets} × ${target}</div></div>${old?`<div class="wo-prev">Anterior · ${esc(setSummary(old))}</div>`:''}<div class="wo-set-head"><span>Série</span><span>Peso</span><span>Reps</span></div>${setRows}</div>`
  }).join('');
  list.innerHTML=shell(`<div class="wo-session-head"><div><button class="wo-back" data-wo-back>← Plano</button><h2 style="margin-top:12px">${esc(plan.name)}</h2><div class="wo-muted">${personName(wo.person)} · ${plan.day}</div></div><div class="wo-date"><label>Data</label><input id="woDate" type="date" value="${today()}"></div></div>${ex}<label>Notas do treino</label><textarea id="woNotes" class="wo-note" placeholder="Opcional: técnica, dores, energia, alterações..."></textarea><div class="wo-actions"><button class="wo-btn primary" id="woSave">Guardar treino</button><button class="wo-btn" data-wo-back>Cancelar</button></div><div id="woStatus"></div>`);
  bindCommon(list);list.querySelectorAll('[data-wo-back]').forEach(b=>b.onclick=()=>{wo.session=null;renderWorkout()});
  list.querySelector('#woSave').onclick=()=>saveSession(plan,list);
}

async function saveSession(plan,list){
  const date=list.querySelector('#woDate').value||today();
  const exercises=plan.ex.map(([name,sets,target],i)=>({name,target,sets:Array.from({length:sets},(_,j)=>({kg:list.querySelector(`[data-kg="${i}-${j}"]`).value,reps:list.querySelector(`[data-reps="${i}-${j}"]`).value}))}));
  const hasAny=exercises.some(e=>e.sets.some(s=>s.kg||s.reps));
  if(!hasAny){list.querySelector('#woStatus').innerHTML='<div class="wo-muted">Preenche pelo menos uma série antes de guardar.</div>';return}
  const now=Date.now(),data={person:wo.person,dayId:plan.id,day:plan.day,name:plan.name,date,exercises,notes:list.querySelector('#woNotes').value.trim(),createdAt:now};
  const row={id:`workout-${wo.person}-${now}-${Math.random().toString(36).slice(2,7)}`,title:`Treino ${personName(wo.person)} · ${plan.name}`,area:'Pessoal',type:'Workout',priority:'Baixa',due:date,status:'feito',notes:JSON.stringify(data),url:'',deleted:false,createdAt:now,updatedAt:now};
  await window.dbPut(row);if(window.scheduleSync)window.scheduleSync();
  wo.session=null;wo.tab='history';await renderWorkout();
}

async function renderHistory(list){
  const h=await history(),totalVol=Math.round(h.reduce((a,x)=>a+volumeOf(x.data),0));
  const sessionsThisMonth=h.filter(x=>(x.row.due||'').slice(0,7)===today().slice(0,7)).length;
  const items=h.map(({row,data})=>`<div class="wo-history-item"><div class="wo-history-head" data-wo-history><div><div class="wo-history-title">${esc(data.name||row.title)}</div><div class="wo-muted">${fmtDate(row.due)} · ${esc(data.day||'')} · ${personName(data.person)}</div></div><span class="wo-muted">›</span></div><div class="wo-history-body">${(data.exercises||[]).map(e=>`<div class="wo-history-ex"><div class="wo-ex-name">${esc(e.name)}</div><div class="wo-history-sets">${esc(setSummary(e))}</div></div>`).join('')}${data.notes?`<div class="wo-muted" style="margin-top:10px">Notas: ${esc(data.notes)}</div>`:''}</div></div>`).join('');
  list.innerHTML=shell(`<div class="wo-kpis"><div class="wo-kpi"><small>Total</small><b>${h.length}</b></div><div class="wo-kpi"><small>Este mês</small><b>${sessionsThisMonth}</b></div><div class="wo-kpi"><small>Volume registado</small><b>${totalVol?totalVol.toLocaleString('pt-PT'):'—'}</b></div></div>${items||'<div class="wo-empty">Ainda não existem treinos guardados.</div>'}`);
  bindCommon(list);list.querySelectorAll('[data-wo-history]').forEach(x=>x.onclick=()=>x.closest('.wo-history-item').classList.toggle('open'));
}

function bindCommon(list){
  list.querySelectorAll('[data-wo-person]').forEach(b=>b.onclick=()=>{wo.person=b.dataset.woPerson;wo.session=null;renderWorkout()});
  list.querySelectorAll('[data-wo-tab]').forEach(b=>b.onclick=()=>{wo.tab=b.dataset.woTab;wo.session=null;renderWorkout()});
}

window.Workout={mount:renderWorkout};
})();
