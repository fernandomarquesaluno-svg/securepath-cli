let py;
const root=new URL('./',self.location.href);
const emit=(type,extra={})=>postMessage({type,...extra});
self.onmessage=async ({data})=>{
  try{
    if(data.type==='init'){
      importScripts(new URL('runtime/pyodide.js',root).href);
      py=await loadPyodide({indexURL:new URL('runtime/',root).href});
      const response=await fetch(new URL('artefatos.py',root));
      if(!response.ok)throw new Error('Núcleo Python indisponível');
      py.FS.writeFile('/home/pyodide/artefatos.py',await response.text());
      py.runPython('import sys, json\nfrom pathlib import Path\nsys.path.insert(0, "/home/pyodide")\nfrom artefatos import Summary, RULES, IGNORED_DIRS, scan_file, load_rules_file');
      emit('ready');return;
    }
    if(!py||data.type!=='scan')return;
    const {files,custom,exclusions}=data;
    py.FS.writeFile('/tmp/rules.json',custom||'{"rules":[]}');
    py.runPython('active_rules=load_rules_file(Path("/tmp/rules.json"))');
    py.FS.unlink('/tmp/rules.json');
    const ignored=new Set(JSON.parse(py.runPython('json.dumps(sorted(IGNORED_DIRS))')));
    for(const d of exclusions)ignored.add(d);
    const result={scanner:'SecurePath CLI (Python / Pyodide)',schema_version:'1.0',summary:{examined:0,skipped:0,io_errors:0,findings:0},findings:[]};
    for(let i=0;i<files.length;i++){
      const {file:f,path}=files[i];
      if(path.split('/').slice(0,-1).some(d=>ignored.has(d))||f.size>5*1024*1024){result.summary.skipped++;}
      else{
        py.FS.writeFile('/tmp/input',new Uint8Array(await f.arrayBuffer()));
        try{
          const item=JSON.parse(py.runPython('summary=Summary(output_format="json")\nscan_file(Path("/tmp/input"),summary,5*1024*1024,rules=active_rules,emit=False)\njson.dumps({"examined":summary.examined,"skipped":summary.skipped,"io_errors":summary.errors,"findings":[f.to_dict() for f in summary.records]})'));
          for(const k of ['examined','skipped','io_errors'])result.summary[k]+=item[k];
          for(const hit of item.findings)result.findings.push({...hit,path});
        }finally{py.FS.unlink('/tmp/input');}
      }
      emit('progress',{done:i+1,total:files.length});
    }
    result.summary.findings=result.findings.length;
    emit('result',{result});
  }catch(e){console.error(String(e));emit('error',{message:data.type==='init'?'Não foi possível iniciar Python no navegador.': 'Falha na análise ou configuração inválida. Confira as regras e tente novamente.'});}
};
