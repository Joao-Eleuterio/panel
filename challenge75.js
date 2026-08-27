(function(){
'use strict';

const STATE_ID='learning-system-v1';
const VERSION=1;
const POINTS={quest:5,review:2,workout:5,movement:2,sleep:2,reading:1};
const LEVELS=[{name:'Bronze',min:30},{name:'Prata',min:40},{name:'Ouro',min:50},{name:'Perfect',min:60}];
const DEFAULT_CARDS=[
  ['graph-rdf','Graph / KG','What is RDF?','Explica RDF em 30 segundos e diz porque não é simplesmente uma graph database.'],
  ['graph-triple','Graph / KG','What is an RDF triple?','Explica subject, predicate e object e cria um exemplo.'],
  ['graph-uri','Graph / KG','URI vs Literal','Quando usarias cada um num grafo RDF?'],
  ['graph-rdfs','Graph / KG','RDF vs RDFS','Que problema acrescenta RDFS ao RDF?'],
  ['graph-owl','Graph / KG','What is OWL?','Explica para que serve e como difere de RDFS.'],
  ['graph-shacl','Graph / KG','What is SHACL?','Explica Node Shape, Property Shape e dá um constraint.'],
  ['graph-sparql','Graph / KG','What is SPARQL?','Explica SELECT/WHERE e escreve mentalmente uma query simples.'],
  ['se-process-thread','Software Fundamentals','Process vs Thread','Explica memória, isolamento, custo e concorrência.'],
  ['se-context-switch','Software Fundamentals','What is a context switch?','O que muda e porque tem custo?'],
  ['se-stack-heap','Software Fundamentals','Stack vs Heap','Explica lifetime, allocation e referências sem decorar slogans.'],
  ['se-di','Software Fundamentals','Transient vs Scoped vs Singleton','Explica lifetime e dá um exemplo adequado de cada.'],
  ['se-dbcontext','Software Fundamentals','Why is DbContext usually Scoped?','Porque não Singleton? O que acontece durante um request?'],
  ['se-async','Software Fundamentals','How does async/await work?','Explica sem dizer apenas “cria outra thread”.'],
  ['se-span','Software Fundamentals','Span<T> vs Memory<T>','Que problema resolvem e qual pode atravessar async boundaries?'],
  ['se-gc','Software Fundamentals','How does .NET GC work?','Explica generations, roots e porque allocations têm custo.']
].map(([id,track,q,prompt])=>({id,track,q,prompt,status:'red',answer:'',nextReview:null,lastReview:null,reviews:0}));

let root=null,tab='today',state=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iso=(d=new Date())=>d.toISOString().slice(0,10);
function addDays(date,n){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+n);return iso(d)}
function weekKey(date=iso()){const d=new Date(date+'T12:00:00');const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return iso(d)}
function blank(){return {version:VERSION,cards:structuredClone(DEFAULT_CARDS),logs:[],weeklyTarget:40,gamingHours:{},createdAt:Date.now(),updatedAt:Date.now()}}
async function load(){
  if(typeof window.dbGet==='function'){
    const row=await window.dbGet(STATE_ID);
    if(row?.notes){try{state=JSON.parse(row.notes)}catch(e){}}
  }
  if(!state) state=blank();
  state.cards=Array.isArray(state.cards)?state.cards:structuredClone(DEFAULT_CARDS);
  for(const d of DEFAULT_CARDS) if(!state.cards.some(c=>c.id===d.id)) state.cards.push(structuredClone(d));
  state.logs=Array.isArray(state.logs)?state.logs:[];
  state.gamingHours=state.gamingHours||{};
  state.weeklyTarget=state.weeklyTarget||40;
}
async function save(){
  state.updatedAt=Date.now();
  if(typeof window.dbPut==='function'){
    const now=Date.now();
    await window.dbPut({id:STATE_ID,title:'Flexible Learning System',area:'Pessoal',type:'Config',priority:'Baixa',due:'',status:'aberto',notes:JSON.stringify(state),url:'',deleted:false,createdAt:state.createdAt||now,updatedAt:now});
    if(typeof window.scheduleSync==='function') window.scheduleSync();
  }
}
function thisWeekLogs(){const w=weekKey();return state.logs.filter(x=>x.date>=w&&x.date<addDays(w,7))}
function points(){return thisWeekLogs().reduce((a,x)=>a+(POINTS[x.kind]||0),0)}
function count(kind){return thisWeekLogs().filter(x=>x.kind===kind).length}
function level(p=points()){let cur='A começar';for(const l of LEVELS)if(p>=l.min)cur=l.name;return cur}
function nextLevel(p=points()){return LEVELS.find(l=>p<l.min)||null}
function dueCards(){const t=iso();return state.cards.filter(c=>!c.nextReview||c.nextReview<=t).sort((a,b)=>({red:0,yellow:1,green:2}[a.status]-({red:0,yellow:1,green:2}[b.status]))}
function progressPct(){return Math.min(100,Math.round(points()/state.weeklyTarget*100))}
function setChrome(){
  const t=document.getElementById('viewTitle'),s=document.getElementById('viewSub');if(t)t.textContent='Progresso';if(s)s.textContent='Sistema flexível · sem dias falhados';
  const b=document.querySelector('[data-view="challenge75"]');if(b){for(const n of [...b.childNodes])if(n.nodeType===3)n.textContent='Progresso';}
}
function tabs(){return `<div class="c75-tabs"><button data-ls-tab="today" class="${tab==='today'?'on':''}">Hoje</button><button data-ls-tab="cards" class="${tab==='cards'?'on':''}">Cartas</button><button data-ls-tab="week" class="${tab==='week'?'on':''}">Semana</button><button data-ls-tab="settings" class="${tab==='settings'?'on':''}">Definições</button></div>`}
function bar(){return `<div class="c75-progress"><i style="width:${progressPct()}%"></i></div>`}
async function render(){setChrome();if(tab==='today')renderToday();else if(tab==='cards')renderCards();else if(tab==='week')renderWeek();else renderSettings();bindCommon()}
function renderToday(){
  const p=points(),next=nextLevel(p),due=dueCards();
  root.innerHTML=`<div class="c75 ls">${tabs()}
  <div class="c75-head"><div><div class="c75-title">${p} pontos · ${level(p)}</div><div class="c75-muted">Meta semanal ${state.weeklyTarget} · ${Math.max(0,state.weeklyTarget-p)} em falta</div></div><span class="c75-status">${progressPct()}%</span></div>${bar()}
  <div class="ls-rule"><b>Regra do sistema</b><span>Não tens tarefas diárias obrigatórias. Acumula durante a semana. Antes de uma sessão longa de gaming, tenta fazer 1 Quest de 25 min.</span></div>
  <div class="section-t">Ganhar pontos</div><div class="ls-actions">
    ${action('quest','🧠','Quest 25 min','+5')}${action('review','🃏','Revisão ativa','+2')}${action('workout','🏋️','Treino ≥30 min','+5')}${action('movement','🚶','Movimento ≥20 min','+2')}${action('sleep','🌙','Sono / rotina','+2')}${action('reading','📖','Leitura ≥10 min','+1')}
  </div>
  <div class="section-t">Próxima quest</div>${due.length?cardHTML(due[0],true):'<div class="c75-ok">Sem cartas pendentes. Podes aprender um conceito novo.</div>'}
  <div class="ls-mini"><span>Quests <b>${count('quest')}</b></span><span>Revisões <b>${count('review')}</b></span><span>🟢 <b>${state.cards.filter(c=>c.status==='green').length}</b></span></div>
  </div>`;
}
function action(kind,ico,name,pts){return `<button class="ls-action" data-add="${kind}"><span>${ico}</span><b>${name}</b><small>${pts}</small></button>`}
function cardHTML(c,compact=false){const icon=c.status==='green'?'🟢':c.status==='yellow'?'🟡':'🔴';return `<div class="ls-card" data-card="${esc(c.id)}"><div class="ls-card-top"><span>${icon}</span><div><small>${esc(c.track)}</small><b>${esc(c.q)}</b></div></div>${compact?'':`<p>${esc(c.prompt)}</p>${c.answer?`<div class="ls-answer"><small>A tua resposta</small>${esc(c.answer)}</div>`:''}`}<div class="ls-card-actions"><button data-open-card="${esc(c.id)}">Testar</button>${!compact?`<button data-edit-answer="${esc(c.id)}">Resposta</button>`:''}</div></div>`}
function renderCards(){const tracks=['Todas',...new Set(state.cards.map(c=>c.track))];root.innerHTML=`<div class="c75 ls">${tabs()}<div class="ls-card-head"><div><div class="c75-title">Knowledge Cards</div><div class="c75-muted">Não releias: tenta responder antes de revelar/editar.</div></div><button class="c75-btn" data-new-card>+ Carta</button></div><div class="ls-summary"><span>🔴 ${state.cards.filter(c=>c.status==='red').length}</span><span>🟡 ${state.cards.filter(c=>c.status==='yellow').length}</span><span>🟢 ${state.cards.filter(c=>c.status==='green').length}</span><span>Hoje ${dueCards().length}</span></div>${state.cards.sort((a,b)=>({red:0,yellow:1,green:2}[a.status]-({red:0,yellow:1,green:2}[b.status])).map(c=>cardHTML(c)).join('')}</div>`}
function renderWeek(){const p=points(),w=weekKey(),gaming=state.gamingHours[w]||0;root.innerHTML=`<div class="c75 ls">${tabs()}<div class="c75-head"><div><div class="c75-title">Semana · ${p} pontos</div><div class="c75-muted">${w} → ${addDays(w,6)} · nível ${level(p)}</div></div></div>${bar()}<div class="ls-week-grid">${metric('🧠','Quests',count('quest'))}${metric('🃏','Revisões',count('review'))}${metric('🏋️','Treino',count('workout'))}${metric('🚶','Movimento',count('movement'))}${metric('🌙','Sono',count('sleep'))}${metric('📖','Leitura',count('reading'))}</div><div class="ls-rule"><b>Gaming esta semana</b><span><input id="lsGaming" type="number" min="0" step="0.5" value="${gaming}" style="max-width:100px"> horas · mede, não castigues.</span></div><div class="section-t">Boss Fight</div><div class="ls-rule"><b>10 perguntas sem apontamentos</b><span>Marca cada carta 🔴, 🟡 ou 🟢 pela qualidade da tua explicação. O objetivo é aumentar o número de conceitos que consegues produzir sem ajuda.</span><button class="c75-btn primary" data-boss>Começar Boss Fight</button></div></div>`}
function metric(i,n,v){return `<div class="c75-metric"><small>${i} ${n}</small><b>${v}</b></div>`}
function renderSettings(){root.innerHTML=`<div class="c75 ls">${tabs()}<div class="section-t">Meta semanal</div><div class="ls-rule"><b>Pontos alvo</b><span><input id="lsTarget" type="number" min="10" max="100" step="5" value="${state.weeklyTarget}" style="max-width:100px"> · começa sustentável; 40 = Prata.</span></div><div class="section-t">Pontuação</div><div class="ls-rule"><span>Quest 25 min <b>+5</b> · revisão ativa <b>+2</b> · treino ≥30 min <b>+5</b> · movimento ≥20 min <b>+2</b> · sono/rotina <b>+2</b> · leitura ≥10 min <b>+1</b>.</span></div><div class="section-t">Princípio</div><div class="ls-rule"><span>Uma semana caótica não reinicia nada. Ajusta a meta quando a capacidade mudar. O calendário guarda compromissos; esta página guarda progresso.</span></div><button class="c75-btn danger" data-reset-week>Apagar registos desta semana</button></div>`}
function bindCommon(){
  root.querySelectorAll('[data-ls-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.lsTab;render()});
  root.querySelectorAll('[data-add]').forEach(b=>b.onclick=async()=>{state.logs.push({id:crypto.randomUUID(),kind:b.dataset.add,date:iso(),at:Date.now()});await save();render()});
  root.querySelectorAll('[data-open-card]').forEach(b=>b.onclick=()=>openCard(b.dataset.openCard));
  root.querySelectorAll('[data-edit-answer]').forEach(b=>b.onclick=()=>editAnswer(b.dataset.editAnswer));
  const g=root.querySelector('#lsGaming');if(g)g.onchange=async()=>{state.gamingHours[weekKey()]=Math.max(0,+g.value||0);await save()};
  const t=root.querySelector('#lsTarget');if(t)t.onchange=async()=>{state.weeklyTarget=Math.max(10,Math.min(100,+t.value||40));await save();render()};
  const n=root.querySelector('[data-new-card]');if(n)n.onclick=newCard;
  const boss=root.querySelector('[data-boss]');if(boss)boss.onclick=()=>{const due=dueCards();openCard((due[0]||state.cards[Math.floor(Math.random()*state.cards.length)]).id)};
  const reset=root.querySelector('[data-reset-week]');if(reset)reset.onclick=async()=>{if(confirm('Apagar apenas os pontos/registos desta semana?')){const w=weekKey();state.logs=state.logs.filter(x=>!(x.date>=w&&x.date<addDays(w,7)));await save();render()}};
}
async function openCard(id){const c=state.cards.find(x=>x.id===id);if(!c)return;const attempt=prompt(`${c.q}\n\n${c.prompt}\n\nExplica sem consultar. Escreve palavras-chave ou cancela depois de responder em voz alta:`,'');if(attempt===null)return;const grade=prompt('Como correu? Escreve: red, yellow ou green','yellow');if(!grade)return;const g=grade.toLowerCase().startsWith('g')?'green':grade.toLowerCase().startsWith('r')?'red':'yellow';c.status=g;c.lastReview=iso();c.reviews=(c.reviews||0)+1;const gaps=g==='green'?[1,3,7,14,30]:g==='yellow'?[1,3,7]:[1];const idx=Math.min(c.reviews-1,gaps.length-1);c.nextReview=addDays(iso(),gaps[idx]);if(attempt.trim())c.answer=attempt.trim();state.logs.push({id:crypto.randomUUID(),kind:'review',date:iso(),at:Date.now(),cardId:id});await save();render()}
async function editAnswer(id){const c=state.cards.find(x=>x.id===id);const v=prompt(`Resposta curta / modelo mental para: ${c.q}`,c.answer||'');if(v===null)return;c.answer=v.trim();await save();render()}
async function newCard(){const q=prompt('Pergunta / conceito:');if(!q)return;const track=prompt('Track:','Software Fundamentals')||'Geral';const p=prompt('Prompt de teste / o que tens de conseguir explicar:','Explica em 30 segundos e dá um exemplo.')||'';state.cards.push({id:crypto.randomUUID(),track,q:q.trim(),prompt:p.trim(),status:'red',answer:'',nextReview:null,lastReview:null,reviews:0});await save();render()}

window.Challenge75={mount:async el=>{root=el;await load();setChrome();render()},unmount:()=>{root=null}};
})();