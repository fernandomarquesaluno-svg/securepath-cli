'use strict';

// SecurePath Atlas v2 — interface educacional; nenhuma credencial é enviada ou analisada.
const $ = (q, root = document) => root.querySelector(q);
const $$ = (q, root = document) => Array.from(root.querySelectorAll(q));
const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const steps = [
 {label:'ETAPA 01 / ENTRADA',title:'Tudo começa com um caminho.',description:'Informe um arquivo ou uma pasta. Se você apontar para um diretório, o SecurePath percorre suas subpastas de forma recursiva e em ordem estável.',detail:'O arquivo é analisado localmente. Nenhum conteúdo é enviado a um servidor.',symbol:'⌁',a:'projeto/',b:'arquivo.py'},
 {label:'ETAPA 02 / FILTRAGEM',title:'Nem todo arquivo precisa ser lido.',description:'Antes da leitura, o programa verifica se o arquivo é regular, se não é um link simbólico e se respeita o tamanho máximo. Pastas como .git e node_modules são excluídas.',detail:'Por padrão, arquivos acima de 5 MiB e arquivos com byte NUL nos primeiros 4096 bytes são ignorados.',symbol:'⊘',a:'limite: 5 MiB',b:'filtros ativos'},
 {label:'ETAPA 03 / BUSCA',title:'Sete regras procuram sinais de risco.',description:'O conteúdo aceito é lido linha a linha. Expressões regulares procuram identificadores AWS, tokens, cabeçalhos de chaves e atribuições de senhas.',detail:'Cada regra pode gerar um alerta por linha. Trata-se de reconhecimento heurístico, não de confirmação de que uma credencial é válida.',symbol:'⌕',a:'SEC001—007',b:'regex / linhas'},
 {label:'ETAPA 04 / SAÍDA',title:'O resultado aponta onde investigar.',description:'A saída informa categoria, caminho e linha do indício. Você pode escolher texto ou JSON estruturado sem exibir o conteúdo da credencial.',detail:'Com --fail-on-findings, alertas podem retornar código 1. Erros de I/O retornam 2 e têm prioridade.',symbol:'✓',a:'texto | JSON',b:'valores ocultos'}
];
const rules = [
 {id:'SEC001',short:'AWS Access Key',group:'token',category:'Tokens e IDs',title:'Identificador de acesso AWS',description:'Localiza IDs de chave de acesso AWS iniciados em AKIA e seguidos por 16 caracteres alfanuméricos maiúsculos.',pattern:'AKIA + 16 caracteres [A–Z, 0–9]',caution:'Reconhecer um ID não prova que ele pertence a uma chave existente, ativa ou com permissões.',art:'AKIA'},
 {id:'SEC002',short:'Bearer token',group:'token',category:'Tokens e IDs',title:'Token em cabeçalho Bearer',description:'Busca o prefixo Bearer seguido de uma sequência textual de pelo menos 20 caracteres aceitos pelo padrão.',pattern:'Bearer + sequência com 20+ caracteres',caution:'O programa não consulta o provedor nem verifica a validade ou o vencimento do token.',art:'Bearer'},
 {id:'SEC003',short:'Chave privada RSA',group:'key',category:'Chaves privadas',title:'Cabeçalho de chave privada RSA',description:'Reconhece a marca textual de início de uma chave privada RSA no formato legado PEM.',pattern:'-----BEGIN RSA PRIVATE KEY-----',caution:'Um cabeçalho, isoladamente, não demonstra a existência de uma chave criptográfica válida.',art:'RSA'},
 {id:'SEC004',short:'Senhas e segredos',group:'password',category:'Senhas',title:'Senhas ou segredos atribuídos',description:'Busca atribuições entre aspas para nomes como password, passwd, pwd, secret e algumas variantes com prefixos, como db_password.',pattern:'db_password = "exemplo_ficticio"',caution:'A regex não entende o contexto completo do software e não cobre todas as maneiras de armazenar segredos.',art:'••••'},
 {id:'SEC005',short:'AWS temporária',group:'token',category:'Tokens e IDs',title:'Identificador AWS temporário',description:'Procura IDs de chave temporária AWS com prefixo ASIA e 16 caracteres maiúsculos ou numéricos.',pattern:'ASIA + 16 caracteres [A–Z, 0–9]',caution:'O formato não comprova se o ID está em uso ou se a sessão correspondente está ativa.',art:'ASIA'},
 {id:'SEC006',short:'GitHub token',group:'token',category:'Tokens e IDs',title:'Token pessoal clássico GitHub',description:'Localiza possíveis tokens pessoais clássicos do GitHub cujo formato começa com ghp_.',pattern:'ghp_ + 36 caracteres alfanuméricos',caution:'Essa regra não cobre todos os formatos atuais e futuros de credenciais do GitHub.',art:'ghp_'},
 {id:'SEC007',short:'PEM / OpenSSH',group:'key',category:'Chaves privadas',title:'Cabeçalho PEM / OpenSSH',description:'Reconhece cabeçalhos de chave privada genérica, EC e OpenSSH em arquivos de texto.',pattern:'BEGIN PRIVATE KEY / EC / OPENSSH',caution:'A presença de um cabeçalho não verifica o conteúdo completo ou a validade da chave.',art:'PEM'}
];
const scenarios = {
 demo: {path:'demonstracao',files:['chave_exemplo.txt','configuracao.py','servico.py'],examined:3,skipped:0,errors:0,findings:[
  {rule_id:'SEC007',category:'Cabeçalho de chave privada PEM/OpenSSH',path:'demonstracao/chave_exemplo.txt',line:2},
  {rule_id:'SEC005',category:'AWS Temporary Access Key ID',path:'demonstracao/configuracao.py',line:2},
  {rule_id:'SEC006',category:'GitHub personal access token (clássico)',path:'demonstracao/configuracao.py',line:3},
  {rule_id:'SEC004',category:'Senha/segredo atribuído',path:'demonstracao/configuracao.py',line:4}
 ]},
 original: {path:'teste.txt',files:['teste.txt'],examined:1,skipped:0,errors:0,findings:[
  {rule_id:'SEC001',category:'AWS Access Key ID',path:'teste.txt',line:3},
  {rule_id:'SEC004',category:'Senha/segredo atribuído',path:'teste.txt',line:4},
  {rule_id:'SEC002',category:'Bearer token',path:'teste.txt',line:5},
  {rule_id:'SEC003',category:'Cabeçalho de chave RSA privada',path:'teste.txt',line:6},
  {rule_id:'SEC004',category:'Senha/segredo atribuído',path:'teste.txt',line:7}
 ]},
 clean:{path:'demonstracao/servico.py',files:['servico.py'],examined:1,skipped:0,errors:0,findings:[]}
};
const install = {
 linux:'git clone https://github.com/fernandomarquesaluno-svg/securepath-cli.git\ncd securepath-cli\npython3 -m unittest discover -s tests -v\npython3 artefatos.py demonstracao',
 windows:'git clone https://github.com/fernandomarquesaluno-svg/securepath-cli.git\ncd securepath-cli\npy -3 -m unittest discover -s tests -v\npy -3 artefatos.py demonstracao'
};

let activeStep=0, activeRule='SEC001', activeGroup='all', activeScenario='demo', reportFormat='text', activeOS='linux';
let simulationHandle=null;

function renderStep(index) {
 activeStep=(index+steps.length)%steps.length;
 const step=steps[activeStep];
 $('#step-label').textContent=step.label;
 $('#step-title').textContent=step.title;
 $('#step-desc').textContent=step.description;
 $('#step-detail').textContent=step.detail;
 $('#step-count').textContent=String(activeStep+1).padStart(2,'0')+' DE 04';
 $('#art-symbol').textContent=step.symbol;
 $('#art-label-one').textContent=step.a;
 $('#art-label-two').textContent=step.b;
 $('#workflow-art').dataset.view=String(activeStep);
 $$('.workflow-tab').forEach((node,i)=>{
  const selected=i===activeStep;
  node.classList.toggle('active',selected);
  node.setAttribute('aria-pressed',String(selected));
 });
}
$$('.workflow-tab').forEach(node=>node.addEventListener('click',()=>renderStep(Number(node.dataset.step))));
$('#next-step').addEventListener('click',()=>renderStep(activeStep+1));

function visibleRules(){return rules.filter(rule=>activeGroup==='all'||rule.group===activeGroup)}
function renderRuleDetail() {
 const rule=rules.find(item=>item.id===activeRule)||visibleRules()[0];
 if(!rule)return;
 activeRule=rule.id;
 $('#rule-code').textContent=rule.id+' / REGEX';
 $('#rule-art').textContent=rule.art;
 $('#rule-title').textContent=rule.title;
 $('#rule-description').textContent=rule.description;
 $('#rule-pattern').textContent=rule.pattern;
 $('#rule-caution').textContent=rule.caution;
 $$('.rule-option').forEach(btn=>{
  const selected=btn.dataset.rule===rule.id;
  btn.classList.toggle('active',selected);
  btn.setAttribute('aria-pressed',String(selected));
 });
}
function renderRules(){
 const all=visibleRules();
 const list=$('#rules-options');
 list.replaceChildren();
 $('#rules-count').textContent=String(all.length).padStart(2,'0');
 if(!all.some(rule=>rule.id===activeRule))activeRule=all[0]?.id||'SEC001';
 for(const rule of all){
  const btn=document.createElement('button');
  btn.type='button';btn.className='rule-option';
  btn.dataset.rule=rule.id;
  btn.setAttribute('aria-pressed',String(rule.id===activeRule));
  const code=document.createElement('span');code.textContent=rule.id;
  const title=document.createElement('strong');title.textContent=rule.short;
  const category=document.createElement('small');category.textContent=rule.category;
  btn.append(code,title,category);
  btn.addEventListener('click',()=>{activeRule=rule.id;renderRuleDetail()});
  list.appendChild(btn);
 }
 renderRuleDetail();
}
$$('.rule-filter-btn').forEach(btn=>btn.addEventListener('click',()=>{
 activeGroup=btn.dataset.group;
 $$('.rule-filter-btn').forEach(item=>{
  const selected=item===btn;
  item.classList.toggle('active',selected);
  item.setAttribute('aria-pressed',String(selected));
 });
 renderRules();
}));

function cancelSimulation() {
 if(simulationHandle!==null){clearInterval(simulationHandle);simulationHandle=null;}
 $('#demo-run').disabled=false;
 $('#demo-run').innerHTML='<span>▶</span> Iniciar simulação';
}
function buildTree(){
 const data=scenarios[activeScenario];
 const list=$('#demo-tree');
 list.replaceChildren();
 if(activeScenario==='demo'){
  const folder=document.createElement('div');folder.className='demo-folder';folder.textContent='▣ demonstracao/';list.appendChild(folder);
 }
 data.files.forEach((name,index)=>{
  const item=document.createElement('div');item.className='demo-file';
  item.textContent=(index===data.files.length-1?'└─ ':'├─ ')+name;
  item.dataset.filename=name;list.appendChild(item);
 });
}
function resetDemo(){
 cancelSimulation();
 const data=scenarios[activeScenario];
 $('#report-command').textContent='$ python artefatos.py '+data.path+(reportFormat==='json'?' --format json':'');
 $('#report-output').textContent='Aguardando análise. Clique no botão abaixo para começar.';
 $('#result-files').textContent='—';$('#result-alerts').textContent='—';$('#result-errors').textContent='—';
 $('#demo-progress-label').textContent='PRONTO PARA VARREDURA';
 buildTree();
}
function chooseScenario(name){
 activeScenario=name;
 $$('.scenario').forEach(btn=>{const selected=btn.dataset.scenario===name;btn.classList.toggle('active',selected);btn.setAttribute('aria-pressed',String(selected))});
 resetDemo();
}
function chooseFormat(name){
 reportFormat=name;
 $$('.report-format').forEach(btn=>{const selected=btn.dataset.format===name;btn.classList.toggle('active',selected);btn.setAttribute('aria-pressed',String(selected))});
 resetDemo();
}
$$('.scenario').forEach(btn=>btn.addEventListener('click',()=>chooseScenario(btn.dataset.scenario)));
$$('.report-format').forEach(btn=>btn.addEventListener('click',()=>chooseFormat(btn.dataset.format)));
function outputLines(data){
 if(reportFormat==='json'){
  return JSON.stringify({schema_version:'1.0',scanner:'SecurePath CLI',summary:{examined:data.examined,skipped:data.skipped,io_errors:data.errors,findings:data.findings.length},findings:data.findings},null,2).split('\n');
 }
 const output=data.findings.map(f=>'[ALERTA] '+f.path+':'+f.line+' | '+f.category);
 output.push('');
 output.push('Resumo: arquivos analisados='+data.examined+' | ignorados='+data.skipped+' | erros de I/O='+data.errors+' | alertas='+data.findings.length);
 return output;
}
function endSimulation(data){
 simulationHandle=null;
 $('#demo-run').disabled=false;
 $('#demo-run').innerHTML='<span>↻</span> Repetir simulação';
 $('#demo-progress-label').textContent='SIMULAÇÃO CONCLUÍDA';
 $('#result-files').textContent=String(data.examined).padStart(2,'0');
 $('#result-alerts').textContent=String(data.findings.length).padStart(2,'0');
 $('#result-errors').textContent=String(data.errors).padStart(2,'0');
}
function playSimulation(){
 cancelSimulation();
 const data=scenarios[activeScenario];
 const lines=outputLines(data);
 const terminal=$('#report-output');
 terminal.textContent='';
 $('#demo-progress-label').textContent='REPRODUZINDO SAÍDA...';
 $('#demo-run').disabled=true;
 $('#demo-run').innerHTML='<span>◌</span> Analisando...';
 let cursor=0;
 const insert=()=>{
  if(cursor>=lines.length){
   clearInterval(simulationHandle);endSimulation(data);return;
  }
  terminal.textContent+=(cursor?'\n':'')+lines[cursor++];
  const screen=$('.report-screen');screen.scrollTop=screen.scrollHeight;
  const activeFilename=data.findings[Math.min(Math.max(cursor-1,0),data.findings.length-1)]?.path.split('/').pop();
  $$('.demo-file').forEach(el=>el.classList.toggle('active',el.dataset.filename===activeFilename));
 };
 if(motionReduced){terminal.textContent=lines.join('\n');endSimulation(data)}
 else{insert();simulationHandle=setInterval(insert,reportFormat==='json'?38:360)}
}
$('#demo-run').addEventListener('click',playSimulation);
$$('.os-button').forEach(btn=>btn.addEventListener('click',()=>{
 activeOS=btn.dataset.os;$('#install-commands').textContent=install[activeOS];
 $$('.os-button').forEach(item=>{const selected=btn===item;item.classList.toggle('active',selected);item.setAttribute('aria-pressed',String(selected))});
 $('#copy-code').innerHTML='Copiar comandos <span>⧉</span>';
}));
$('#copy-code').addEventListener('click',async()=>{
 const button=$('#copy-code');
 try{await navigator.clipboard.writeText(install[activeOS]);button.textContent='Copiado ✓'}
 catch(e){
  const range=document.createRange();range.selectNodeContents($('#install-commands'));
  const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);
  button.textContent='Texto selecionado';
 }
});

const menuBtn=$('#menu-button'),mobileNav=$('#mobile-nav');
function closeMenu(){mobileNav.hidden=true;menuBtn.setAttribute('aria-expanded','false');menuBtn.setAttribute('aria-label','Abrir navegação')}
menuBtn.addEventListener('click',()=>{
 const open=mobileNav.hidden;mobileNav.hidden=!open;
 menuBtn.setAttribute('aria-expanded',String(open));
 menuBtn.setAttribute('aria-label',open?'Fechar navegação':'Abrir navegação');
});
$$('#mobile-nav a').forEach(link=>link.addEventListener('click',closeMenu));
window.addEventListener('resize',()=>{if(window.innerWidth>980)closeMenu()});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu()});

if('IntersectionObserver' in window&&!motionReduced){
 const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
   if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}
  });
 },{threshold:.09,rootMargin:'0px 0px -25px 0px'});
 $$('.reveal,.rise').forEach(node=>observer.observe(node));
}else{$$('.reveal,.rise').forEach(node=>node.classList.add('visible'))}
let scrolling=false;
function updateProgress(){
 const max=document.documentElement.scrollHeight-window.innerHeight;
 $('#scroll-progress').style.width=(max>0?Math.min(100,Math.max(0,(window.scrollY/max)*100)):0)+'%';
 scrolling=false;
}
window.addEventListener('scroll',()=>{if(!scrolling){scrolling=true;requestAnimationFrame(updateProgress)}},{passive:true});
window.addEventListener('resize',updateProgress,{passive:true});
renderStep(0);renderRules();resetDemo();updateProgress();



 // SecurePath: eleven animated scenes on one continuous recorded-audio timeline.
 (() => {
 const player=document.getElementById('explainer-player'); if(!player)return;
 const el=id=>document.getElementById(id);
 const scenes=[["01 · O RISCO",0],["02 · A SOLUÇÃO",7.218],["03 · FILTRAGEM",15.794],["04 · DETECÇÃO",24.419],["05 · RELATÓRIO",34.807],["06 · VALIDAÇÃO HISTÓRICA",43.042],["07 · LIMITE DA DETECÇÃO",51.68],["08 · PARALELISMO",62.0133333333],["09 · CONFIGURAÇÃO",71.4783333333],["10 · VALIDAÇÃO ATUAL",80.2493333333],["11 · ROADMAP",90.5673333333]];
 const cues=[[0.256,4.309,"Uma senha esquecida no código pode abrir caminho para acessos indevidos."],[4.736,6.741,"Como encontrar esse risco antes de publicar?"],[7.218,11.016,"O SecurePath CLI analisa arquivos e pastas locais,"],[11.442,13.149,"sem enviar seu conteúdo à rede."],[13.746,15.325,"Foi desenvolvido em Python puro."],[15.794,19.317,"Você informa um caminho. O scanner percorre os arquivos"],[19.445,23.84,"e ignora links simbólicos, pastas excluídas e arquivos grandes."],[24.419,29.411,"Depois, sete regras buscam indícios de tokens, chaves AWS,"],[29.88,32.312,"cabeçalhos privados e senhas atribuídas."],[32.824,34.318,"Tudo por expressões regulares."],[34.807,38.903,"Ao encontrar um padrão, ele mostra arquivo, linha e categoria."],[39.287,42.573,"O valor da possível credencial não aparece no relatório."],[43.042,46.925,"Na demonstração sintética, três arquivos geraram quatro alertas."],[47.456,51.21,"O projeto também documenta dezesseis testes aprovados em Linux."],[51.68,55.861,"Atenção: padrões suspeitos não confirmam segredos válidos."],[56.443,61.478,"Conheça o código e execute o SecurePath apenas nos seus arquivos autorizados."],[62.2693333333,64.14633333329999,"O SecurePath continua evoluindo."],[64.8293333333,71.1863333333,"Agora, a varredura pode usar até sessenta e quatro threads, com uma fila limitada de tarefas pendentes."],[71.4783333333,79.6273333333,"Além disso, um arquivo JSON permite adicionar até cem regras personalizadas, e o usuário pode excluir diretórios específicos."],[80.2493333333,85.9663333333,"A nova suíte contém sessenta e nove testes, incluindo cinquenta casos de configuração de regras."],[86.3503333333,89.80633333329999,"A documentação registra todos aprovados em uma execução local."],[90.5673333333,97.73533333329999,"O próximo passo é medir o desempenho e a precisão da detecção, e integrar a ferramenta ao fluxo de desenvolvimento."],[98.2043333333,100.3373333333,"Esses ganhos ainda precisam ser demonstrados."]];
 const parts=[
 {start:0,duration:62.013333333333335,local:'./media/securepath-narracao-natural.wav',remote:'https://resource2.heygen.ai/text_to_speech/7174ce40798a4bcbbc0b17ae688dad49/9ce5f601f9e04382bb26141d5a3f839d/id=d2f9c659a4e84182b7e5a42508e51b6b.wav'},
 {start:62.013333333333335,duration:38.808412698412695,local:'./media/securepath-narracao-evolucao.wav',remote:"https://resource2.heygen.ai/text_to_speech/7174ce40798a4bcbbc0b17ae688dad49/9ce5f601f9e04382bb26141d5a3f839d/id=2f8d8c07b32145c78c8c72b735dcb6b7.wav"}];
 const duration=parts.reduce((sum,p)=>sum+p.duration,0);
 const voices=parts.map(part=>{const a=new Audio();a.preload='auto';a.src=part.local;return a});
 let track=0,time=0,playing=false,started=false,muted=false,captions=true,silent=false,last=0,frame=0,token=0;
 const overlay=el('clip-start-overlay'),caption=el('clip-subtitles'),status=el('clip-state-label');
 function render(){
   let i=scenes.findIndex((s,k)=>k===scenes.length-1||time<scenes[k+1][1]);i=Math.max(0,i);
   player.querySelectorAll('.clip-scene').forEach((node,k)=>node.classList.toggle('current',k===i));
   el('clip-topic').textContent=scenes[i][0];
   caption.textContent=started?(cues.find(c=>time>=c[0]&&time<=c[1])?.[2]||''):'Clique em reproduzir para acompanhar a explicação narrada.';
   caption.hidden=!captions;
   el('clip-progress-fill').style.width=(100*Math.min(1,time/duration))+'%';
   el('clip-progress-text').textContent='CENA '+(i+1)+' DE '+scenes.length+' · '+Math.floor(time/60)+':'+String(Math.floor(time%60)).padStart(2,'0')+' / 1:41';
   el('clip-play-icon').textContent=playing?'❚❚':time>=duration?'↺':'▶';
   player.classList.toggle('paused',!playing);
 }
 function finish(){playing=false;time=duration;voices.forEach(a=>a.pause());cancelAnimationFrame(frame);status.textContent='EXPLICAÇÃO CONCLUÍDA';render()}
 function tick(now){
   if(!playing)return;
   if(silent){time=Math.min(duration,time+(now-last)/1000);if(time>=duration){finish();return}}
   else if(voices[track].readyState>0){time=Math.min(duration,parts[track].start+voices[track].currentTime)}
   last=now;render();frame=requestAnimationFrame(tick);
 }
 function beginClock(){cancelAnimationFrame(frame);last=performance.now();frame=requestAnimationFrame(tick)}
 function useSilent(message){silent=true;voices.forEach(a=>a.pause());status.textContent=message;beginClock()}
 function playAudio(){
   const a=voices[track],part=parts[track],id=++token;
   a.muted=muted;
   a.play().then(()=>{if(id===token&&playing){silent=false;status.textContent=muted?'REPRODUÇÃO SEM SOM':'NARRAÇÃO AFONSO · PORTUGUÊS'}}).catch(err=>{
     if(id!==token||!playing)return;
     if(err?.name==='NotAllowedError'){playing=false;status.textContent='CLIQUE EM REPRODUZIR PARA CONTINUAR';render();return}
     if(!a.datasetFallback){a.datasetFallback=true;a.src=part.remote;const localTime=Math.max(0,time-part.start);a.addEventListener('loadedmetadata',()=>{a.currentTime=Math.min(localTime,a.duration||localTime)},{once:true});playAudio();return}
     useSilent('ÁUDIO INDISPONÍVEL · LEGENDAS');
   });
 }
 voices.forEach((a,i)=>{
   a.addEventListener('error',()=>{if(!playing||silent||track!==i)return;if(!a.datasetFallback){a.datasetFallback=true;a.src=parts[i].remote;playAudio()}else{token++;useSilent('ÁUDIO INDISPONÍVEL · LEGENDAS')}});
   a.addEventListener('ended',()=>{if(!playing||silent||track!==i)return;if(i===0){track=1;time=parts[1].start;voices[1].currentTime=0;playAudio();render()}else finish()});
 });
 function start(restart=false){
   if(restart||time>=duration){token++;voices.forEach(a=>{a.pause();if(a.readyState)a.currentTime=0});time=0;track=0;silent=false}
   overlay.hidden=true;started=true;playing=true;
   if(silent)status.textContent='ÁUDIO INDISPONÍVEL · LEGENDAS';else{status.textContent='CARREGANDO NARRAÇÃO';playAudio()}
   beginClock();render();
 }
 function pause(){token++;playing=false;voices.forEach(a=>a.pause());cancelAnimationFrame(frame);status.textContent='PAUSADO';render()}
 el('clip-start').addEventListener('click',()=>start(true));
 el('clip-toggle').addEventListener('click',()=>playing?pause():start(!started));
 el('clip-restart').addEventListener('click',()=>start(true));
 el('clip-voice').addEventListener('click',()=>{muted=!muted;voices.forEach(a=>a.muted=muted);el('clip-voice').setAttribute('aria-pressed',String(!muted));el('clip-voice').classList.toggle('selected',!muted);el('clip-voice-icon').textContent=muted?'×':'♫';if(playing&&!silent)status.textContent=muted?'REPRODUÇÃO SEM SOM':'NARRAÇÃO AFONSO · PORTUGUÊS'});
 el('clip-captions').addEventListener('click',()=>{captions=!captions;el('clip-captions').setAttribute('aria-pressed',String(captions));el('clip-captions').classList.toggle('selected',captions);render()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)pause()});
 window.addEventListener('pagehide',()=>{if(playing)pause()});
 // Prefer a revised MP4 only, never the obsolete seven-scene video.
 const native=el('explainer-native'),video=el('explainer-mp4'),screen=el('explainer-screen'),controls=player.querySelector('.clip-controlbar');
 fetch('./media/securepath-explainer-v2.mp4',{method:'HEAD',cache:'no-cache'}).then(r=>{
  if(!r.ok||started||!native||!video)return;
  native.hidden=false;screen.hidden=true;controls.hidden=true;
  video.addEventListener('error',()=>{native.hidden=true;screen.hidden=false;controls.hidden=false},{once:true});
 }).catch(()=>{});
 render();
 })();

// Evolução técnica: visualização conceitual da configuração da CLI atual.
(()=>{
 const slider=document.getElementById('evo-workers'),custom=document.getElementById('evo-custom'),exclude=document.getElementById('evo-exclude');
 if(!slider||!custom||!exclude)return;
 const el=id=>document.getElementById(id);
 function render(){
  const workers=Number(slider.value);
  el('evo-workers-label').textContent=String(workers);
  el('evo-mode').textContent=workers===1?'Modo sequencial':workers+' workers paralelos';
  el('evo-queue').textContent=workers===1?'Sem fila paralela':'Até '+(workers*2)+' tarefas pendentes';
  el('evo-rule-count').textContent=(custom.checked?8:7)+' regras ativas';
  el('evo-command').textContent='python artefatos.py CAMINHO --workers '+workers+(custom.checked?' --rules-file regras.example.json':'')+(exclude.checked?' --exclude-dir generated':'')+' --format json';
  el('evo-model-note').textContent=workers===1?'O scanner processa um arquivo por vez. Não há fila de tarefas paralelas.': 'Até duas tarefas pendentes por worker, incluindo tarefas em execução. Os achados são agregados e ordenados; esta simulação não mede desempenho nem memória total.';
  const visual=el('evo-worker-bars');
  visual.replaceChildren();
  for(let i=0;i<workers;i++){
   const node=document.createElement('span');node.className='evo-worker';node.style.animationDelay=(-(i%8)*.27)+'s';visual.appendChild(node);
  }
  el('evo-copy').textContent='Copiar comando ⧉';
 }
 slider.addEventListener('input',render);custom.addEventListener('change',render);exclude.addEventListener('change',render);
 el('evo-copy').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(el('evo-command').textContent);el('evo-copy').textContent='Copiado ✓'}
  catch(_){const range=document.createRange();range.selectNodeContents(el('evo-command'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);el('evo-copy').textContent='Comando selecionado'}
 });
 render();
})();
