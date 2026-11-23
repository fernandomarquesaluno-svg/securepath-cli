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
