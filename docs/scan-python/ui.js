const $=id=>document.getElementById(id);
let worker=null, timer=null, ready=false, running=false, result=null,dropped=[];
const status=t=>{$('status').textContent=t};
const stopTimer=()=>{clearTimeout(timer);timer=null};
function resetWorker(){stopTimer();if(worker)worker.terminate();worker=null;ready=false;running=false;$('run').disabled=false;$('cancel').disabled=true}
function clearReport(){result=null;$('summary').textContent='Nenhuma análise realizada.';$('rows').replaceChildren();for(const id of ['json','csv','txt'])$(id).disabled=true}
function timeout(ms){stopTimer();timer=setTimeout(()=>{resetWorker();status('Limite de tempo atingido; execução cancelada e memória descartada.')},ms)}
function render(){
  if(!result)return;
  $('summary').textContent='Analisados: '+result.summary.examined+' · Ignorados: '+result.summary.skipped+' · Erros: '+result.summary.io_errors+' · Alertas: '+result.summary.findings;
  const q=$('filter').value.toLowerCase();$('rows').replaceChildren();
  for(const x of result.findings.filter(x=>(x.path+' '+x.category+' '+x.rule_id).toLowerCase().includes(q))){
    const tr=document.createElement('tr');
    for(const v of [x.path,x.line,x.rule_id,x.category]){const td=document.createElement('td');td.textContent=v;tr.append(td)}$('rows').append(tr);
  }
  for(const id of ['json','csv','txt'])$(id).disabled=false;
}
function start(){
  if(running)return;
  const files=[...$('files').files,...$('folder').files,...dropped],text=$('text').value;
  if(text)files.push(new File([text],'texto-sintetico.txt',{type:'text/plain'}));
  if(!files.length){status('Selecione arquivos ou digite texto sintético.');return}
  if(files.length>500||files.reduce((s,f)=>s+f.size,0)>25*1024*1024){status('Limite: 500 arquivos e 25 MiB no total.');return}
  const custom=$('rules').value.trim(),exclusions=$('exclude').value.split(',').map(x=>x.trim()).filter(Boolean);
  if(new TextEncoder().encode(custom).length>65536){status('Limite de 64 KiB para regras.');return}
  resetWorker();clearReport();running=true;$('run').disabled=true;$('cancel').disabled=false;$('progress').max=files.length;$('progress').value=0;
  status('Carregando Python e o núcleo do scanner...');
  const w=new Worker('worker.js');worker=w;
  timeout(90000);
  w.onmessage=({data:m})=>{
    if(w!==worker)return;
    if(m.type==='ready'){status('Analisando localmente...');timeout(30000);w.postMessage({type:'scan',files:files.map(file=>({file,path:file.webkitRelativePath||file.name})),custom,exclusions})}
    if(m.type==='progress'){$('progress').value=m.done;status(m.done+' / '+m.total+' arquivos processados');timeout(30000)}
    if(m.type==='result'){result=m.result;resetWorker();render();status('Análise concluída; memória de trabalho descartada.')}
    if(m.type==='error'){resetWorker();status(m.message)}
  };
  w.onerror=()=>{resetWorker();status('Falha no runtime Python. Recarregue a página.')};
  w.postMessage({type:'init'});
}
$('run').onclick=start;$('cancel').onclick=()=>{resetWorker();status('Cancelado. Memória de trabalho descartada.')};
$('example').onclick=()=>{$('text').value='password = "somente-ficticio"\nstatus = "ok"';status('Exemplo sintético carregado.')};
$('clear').onclick=()=>{resetWorker();for(const id of ['files','folder','text','rules','exclude','filter'])$(id).value='';dropped=[];clearReport();$('progress').value=0;status('Entrada limpa.')};
$('filter').oninput=render;
const zone=$('drop');zone.ondragover=e=>e.preventDefault();zone.ondrop=e=>{e.preventDefault();dropped=[...e.dataTransfer.files];status(dropped.length+' arquivo(s) adicionados por arrastar e soltar.')};
function download(type){
 if(!result)return;
 const safe=x=>{let t=String(x);if(/^[\s]*[=+\-@]/.test(t))t="'"+t;return '"'+t.replaceAll('"','""')+'"'};
 let data=type==='json'?JSON.stringify(result,null,2):type==='csv'?[['arquivo','linha','regra','categoria'],...result.findings.map(x=>[x.path,x.line,x.rule_id,x.category])].map(r=>r.map(safe).join(',')).join('\n'):result.findings.map(x=>x.path+':'+x.line+' | '+x.rule_id+' | '+x.category).join('\n')+'\n'+JSON.stringify(result.summary);
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'text/plain;charset=utf-8'}));a.download='securepath.'+type;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
for(const id of ['json','csv','txt'])$(id).onclick=()=>download(id);
window.addEventListener('pagehide',resetWorker);
