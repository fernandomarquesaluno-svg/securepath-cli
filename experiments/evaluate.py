"""Avaliação reproduzível de artefatos: base 100% sintética, sem validação de credenciais.
Execute na raiz: python experiments/evaluate.py (Linux, GNU time).
Ferramentas opcionais: Gitleaks 8.24.2, TruffleHog 3.88.0, detect-secrets 1.5.0.
"""
import json, os, platform, random, statistics, subprocess, sys, tempfile, time, unittest
from pathlib import Path
from html import escape
from datetime import datetime, timezone
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
DEST=ROOT/'docs'/'experimentos'
DEST.mkdir(parents=True,exist_ok=True)
def save(name,data):
    (DEST/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
class Record(unittest.TextTestResult):
    def __init__(self,*a,**k): super().__init__(*a,**k); self.records=[]
    def addSuccess(self,t): super().addSuccess(t); self.records.append({'test':t.id(),'status':'aprovado'})
    def addFailure(self,t,e): super().addFailure(t,e); self.records.append({'test':t.id(),'status':'falhou'})
    def addError(self,t,e): super().addError(t,e); self.records.append({'test':t.id(),'status':'erro'})
    def addSkip(self,t,reason): super().addSkip(t,reason); self.records.append({'test':t.id(),'status':'ignorado','reason':reason})
r=unittest.TextTestRunner(verbosity=2,resultclass=Record).run(unittest.defaultTestLoader.discover(str(ROOT/'tests')))
save('testes.json',{'total':r.testsRun,'passed':sum(x['status']=='aprovado' for x in r.records),'records':r.records})
if not r.wasSuccessful(): raise SystemExit('Regressão na suíte: publicação bloqueada')
rng=random.Random(24062026)
alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
lower='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
def s(n,chars=lower): return ''.join(rng.choice(chars) for _ in range(n))
# Rótulo semântico: segredo fictício intencional vs conteúdo público.
# As categorias adicionais evitam avaliar apenas padrões do SecurePath.
families=[
 ('aws-id',lambda: 'aws_access_key_id = "AKIA'+s(16,alphabet)+'"'),
 ('aws-temporario',lambda:'aws_access_key_id = "ASIA'+s(16,alphabet)+'"'),
 ('github-classico',lambda:'github_token = "ghp_'+s(36)+'"'),
 ('bearer',lambda:'Authorization: Bearer '+s(32)),
 ('senha',lambda:'db_password = "'+s(24)+'"'),
 ('chave-rsa',lambda:'-----BEGIN RSA PRIVATE KEY-----\nDADOS_FICTICIOS_SEM_CHAVE_REAL\n-----END RSA PRIVATE KEY-----'),
 ('chave-openssh',lambda:'-----BEGIN OPENSSH PRIVATE KEY-----\nDADOS_FICTICIOS_SEM_CHAVE_REAL\n-----END OPENSSH PRIVATE KEY-----'),
 ('stripe',lambda:'stripe_secret_key = "sk_test_'+s(24)+'"'),
 ('slack',lambda:'slack_token = "xoxb-000000000000-000000000000-'+s(24)+'"'),
 ('api-generica',lambda:'api_key = "'+s(32)+'"'),
]
negatives=[('texto-publico','status = "ready"'),('identificador','public_id = "'+s(32)+'"'),('placeholder','password = "CHANGE_ME"'),('exemplo-publico','example_secret = "not_a_real_secret"'),('hash-publico','sha256 = "'+'a'*64+'"'),('token-curto','Authorization: Bearer example'),('url-publica','homepage = "https://example.org/"'),('configuracao','port = 8080'),('marcador-documental','Documentation: BEGIN PRIVATE KEY'),('identificador-curto','AKIA0000')]
manifest=[]
def corpus(base):
    for i,(cat,make) in enumerate(families):
        for j in range(6):
            name=f'p{i:02d}_{j:02d}.'+['txt','env','cfg'][j%3]
            (base/name).write_text('# fixture synthetic\n'+make()+'\n',encoding='utf-8')
            manifest.append({'file':name,'positive':True,'category':cat})
    for i,(cat,value) in enumerate(negatives):
        for j in range(6):
            name=f'n{i:02d}_{j:02d}.'+['txt','env','cfg'][j%3]
            (base/name).write_text('# fixture synthetic\n'+value+'\n',encoding='utf-8')
            manifest.append({'file':name,'positive':False,'category':cat})
def capture(cmd,cwd,timeout=180):
    with tempfile.TemporaryDirectory() as temp:
        measure=Path(temp)/'time.txt'
        start=time.perf_counter()
        p=subprocess.run(['/usr/bin/time','-f','%M','-o',str(measure),*cmd],cwd=cwd,capture_output=True,text=True,timeout=timeout,env={**os.environ,'NO_COLOR':'1'})
        elapsed=time.perf_counter()-start
        rss=int(measure.read_text().strip().splitlines()[-1]) if measure.exists() else None
        return p,round(elapsed,6),rss
def basename(path): return Path(str(path).replace('\\','/')).name
def version(cmd):
    try:
        p=subprocess.run(cmd,capture_output=True,text=True,timeout=20)
        return (p.stdout or p.stderr).strip().splitlines()[0][:160] if p.returncode==0 else 'versão indisponível'
    except Exception: return 'não instalado'
def scores(pred):
    universe={x['file'] for x in manifest}
    if not pred<=universe: raise ValueError('Saída contém arquivo fora do corpus')
    positive={x['file'] for x in manifest if x['positive']}
    negative=universe-positive
    tp=len(pred&positive);fp=len(pred&negative);fn=len(positive-pred);tn=len(negative-pred)
    precision=tp/(tp+fp) if tp+fp else None
    recall=tp/(tp+fn) if tp+fn else None
    f1=2*tp/(2*tp+fp+fn) if 2*tp+fp+fn else None
    return dict(tp=tp,fp=fp,fn=fn,tn=tn,precision=precision,recall=recall,f1=f1,files=sorted(pred),
        categories=[{'category':c,'expected':sum(x['category']==c and x['positive'] for x in manifest),'detected':sum(x['category']==c and x['file'] in pred for x in manifest)} for c in sorted({x['category'] for x in manifest})])
with tempfile.TemporaryDirectory(prefix='securepath-eval-') as tmp:
    base=Path(tmp)/'corpus';base.mkdir();corpus(base)
    save('ground-truth.json',{'seed':24062026,'unit':'arquivo; positivo se contém segredo fictício intencional','files':manifest})
    def evaluate(name,ver,cmd,parser,ok=(0,)):
        row={'tool':name,'version':ver,'command':cmd}
        samples=[]
        try:
            for _ in range(3):
                p,t,m=capture(cmd,base)
                if p.returncode not in ok: raise RuntimeError(f'código de saída {p.returncode}')
                pred=parser(p.stdout)
                samples.append({'seconds':t,'rss_kib':m,'detected_files':sorted(pred)})
            assert all(x['detected_files']==samples[0]['detected_files'] for x in samples),'resultados instáveis'
            row.update(status='executado',**scores(set(samples[0]['detected_files'])),samples=samples,
                       median_seconds=statistics.median(x['seconds'] for x in samples),
                       median_rss_kib=statistics.median(x['rss_kib'] for x in samples))
        except Exception as e: row.update(status='não concluído',error=type(e).__name__+': '+str(e)[:200])
        return row
    glreport=Path(tmp)/'gitleaks.json'
    def gitleaks_parser(_): return {basename(x['File']) for x in json.loads(glreport.read_text())}
    def truffle_parser(raw):
        hits=set()
        for line in raw.splitlines():
            x=json.loads(line)
            file=x.get('SourceMetadata',{}).get('Data',{}).get('Filesystem',{}).get('file')
            if not file: raise ValueError('Registro sem caminho Filesystem')
            hits.add(basename(file))
        return hits
    results=[
      evaluate('SecurePath CLI',subprocess.check_output(['git','rev-parse','--short','HEAD'],text=True,cwd=ROOT).strip(),[sys.executable,str(ROOT/'artefatos.py'),'.','--format','json'],lambda raw:{basename(x['path']) for x in json.loads(raw)['findings']}),
      evaluate('Gitleaks',version(['gitleaks','version']),['gitleaks','dir','.','--redact=100','--report-format','json','--report-path',str(glreport),'--exit-code','0','--no-banner'],gitleaks_parser),
      evaluate('TruffleHog',version(['trufflehog','--version']),['trufflehog','filesystem','.','--json','--no-verification','--no-update','--results=verified,unknown,unverified'],truffle_parser),
      evaluate('detect-secrets',version(['detect-secrets','--version']),['detect-secrets','scan','--all-files','--no-verify','.'],lambda raw:{basename(k) for k,v in json.loads(raw)['results'].items() if v}),
    ]
    assert results[0]['status']=='executado',results[0]
    bench=[]
    for count in (100,1000,5000):
        d=Path(tmp)/f'bench-{count}';d.mkdir()
        for i in range(count):
            (d/f'file-{i:05d}.txt').write_text(('status = "ok"\n'*50)+('password = "fixture_only"\n' if i%10==0 else ''))
        expected=None
        for workers in (1,2,4,8):
            samples=[]
            for _ in range(3):
                p,t,m=capture([sys.executable,str(ROOT/'artefatos.py'),str(d),'--workers',str(workers),'--format','json'],ROOT)
                assert p.returncode==0
                data=json.loads(p.stdout)
                assert data['summary']['examined']==count and data['summary']['findings']==(count+9)//10
                if expected is None: expected=data['findings']
                assert data['findings']==expected
                samples.append({'seconds':t,'rss_kib':m})
            elapsed=statistics.median(x['seconds'] for x in samples)
            bench.append({'files':count,'workers':workers,'median_seconds':elapsed,'median_rss_kib':statistics.median(x['rss_kib'] for x in samples),'files_per_second':count/elapsed,'samples':samples,'same_findings':True})
env={'utc':datetime.now(timezone.utc).isoformat(),'os':platform.platform(),'python':platform.python_version(),'logical_cpus':os.cpu_count(),'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()}
try: env['cpu_model']=next(x.split(':',1)[1].strip() for x in Path('/proc/cpuinfo').read_text().splitlines() if x.startswith('model name'))
except Exception: pass
try: env['memory']=Path('/proc/meminfo').read_text().splitlines()[0]
except Exception: pass
save('comparacao.json',{'environment':env,'scope':'classificação por arquivo; 60 positivos / 60 negativos; detectores padrão; sem verificação remota; 3 repetições','results':results})
save('benchmark.json',{'environment':env,'results':bench})
def e(x): return escape(str(x),quote=True)
def fmt(x,n=3): return '—' if x is None else f'{x:.{n}f}'
def tr(items): return '<tr>'+''.join('<td>'+e(x)+'</td>' for x in items)+'</tr>'
def table(headers,rows): return '<div class="scroll"><table><thead><tr>'+''.join('<th>'+e(x)+'</th>' for x in headers)+'</tr></thead><tbody>'+''.join(rows)+'</tbody></table></div>'
rows=[]
for x in results:
    if x['status']=='executado': rows.append(tr([x['tool'],x['version'],x['tp'],x['fp'],x['fn'],x['tn'],fmt(x['precision']),fmt(x['recall']),fmt(x['f1']),fmt(x['median_seconds']),fmt(x['median_rss_kib']/1024,1)]))
    else: rows.append('<tr><td>'+e(x['tool'])+'</td><td colspan="10">'+e(x['status']+' — '+x['error'])+'</td></tr>')
tests=table(['Teste','Resultado'],[tr([x['test'],x['status']]) for x in r.records])
btable=table(['Arquivos','Workers','Mediana (s)','RSS pico mediano (MiB)','Arquivos/s','Achados iguais'],[tr([x['files'],x['workers'],fmt(x['median_seconds']),fmt(x['median_rss_kib']/1024,1),fmt(x['files_per_second'],1),'Sim']) for x in bench])
bars=''.join('<div class="barrow"><span>'+e(x['tool'])+'</span><div class="track"><div class="bar" style="width:'+str(100*(x['f1'] or 0))+'%"></div></div><b>'+fmt(x['f1'])+'</b></div>' for x in results if x['status']=='executado')
methods="""<p>Base determinística de 120 arquivos: 60 contêm padrões de credenciais fictícias intencionais e 60 são controles negativos, inclusive exemplos de documentação. Um arquivo é positivo se a ferramenta emitir pelo menos um alerta. Duplicatas no mesmo arquivo não alteram a classificação. As 10 famílias incluem padrões além das sete regras do SecurePath. Não foram testadas credenciais válidas. Os detectores usam configurações padrão, sem verificação externa. A base é pequena, artificial e não representativa de repositórios reais; não demonstra superioridade geral. Tempo inclui inicialização do processo e leitura da saída; RSS medido por GNU time. Três repetições em um runner compartilhado, sem garantia de cache frio. Os benchmarks de workers medem somente SecurePath, com achados idênticos exigidos.</p><p>Reprodução: <code>python experiments/evaluate.py</code>. Ferramentas: <a href="https://github.com/gitleaks/gitleaks">Gitleaks</a>, <a href="https://github.com/trufflesecurity/trufflehog">TruffleHog</a>, <a href="https://github.com/Yelp/detect-secrets">detect-secrets</a>. Os comandos e amostras estão nos JSON.</p>"""
doc='<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>SecurePath · Laboratório experimental</title><style>body{background:#0b121a;color:#e6edf4;font:16px system-ui;max-width:1150px;margin:auto;padding:26px}a{color:#b8ff66}h1{font-size:clamp(30px,5vw,56px);line-height:1.04}h2{margin-top:36px}p{line-height:1.7}section{border:1px solid #334656;background:#101d28;padding:22px;border-radius:14px;margin:22px 0}.scroll{overflow:auto}table{width:100%;border-collapse:collapse;font-size:14px}td,th{padding:10px;border-bottom:1px solid #344653;text-align:left}th{color:#b8ff66}code{overflow-wrap:anywhere}.barrow{display:grid;grid-template-columns:minmax(100px,155px) 1fr 60px;gap:12px;align-items:center;margin:12px 0}.track{height:14px;background:#243444;border-radius:5px;overflow:hidden}.bar{height:100%;background:#b8ff66}summary{cursor:pointer}</style><a href="../#scanner">← SecurePath</a><h1>Laboratório experimental</h1><p>Resultados obtidos automaticamente · '+e(env['utc'])+' · commit <code>'+e(env['commit'])+'</code></p><section><h2>Comparação de detecção</h2>'+table(['Ferramenta','Versão','VP','FP','FN','VN','Precisão','Recall','F1','Tempo (s)','RSS (MiB)'],rows)+'<h3>F1 por arquivo</h3>'+bars+'<p>Precisão indefinida (—) quando não há alertas. Um resultado ausente não significa zero.</p></section><section><h2>Benchmark de escalabilidade</h2>'+btable+'</section><section><h2>Suíte funcional: '+str(r.testsRun)+' casos executados</h2><details><summary>Exibir testes individuais</summary>'+tests+'</details></section><section><h2>Metodologia e limitações</h2>'+methods+'<pre style="white-space:pre-wrap">'+e(json.dumps(env,ensure_ascii=False,indent=2))+'</pre><p><a href="testes.json">Testes</a> · <a href="ground-truth.json">Ground truth</a> · <a href="comparacao.json">Comparação</a> · <a href="benchmark.json">Benchmark</a></p></section></html>'
(DEST/'index.html').write_text(doc,encoding='utf-8')
print('Comparação:',[(x['tool'],x['status'],x.get('f1')) for x in results])
print('Benchmark:',[(x['files'],x['workers'],x['median_seconds']) for x in bench])
