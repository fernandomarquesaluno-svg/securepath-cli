import functools,http.server,threading,subprocess,sys,json,tempfile,re
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
root=Path.cwd()
srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=root/'docs'))
threading.Thread(target=srv.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{srv.server_port}'
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={'width':390,'height':844})
    external=[]
    pg.context.route('**/*',lambda route: route.continue_() if route.request.url.startswith(base) else (external.append(route.request.url),route.abort()))
    pg.on('console',lambda msg: print('browser:',msg.type,msg.text))
    pg.on('pageerror',lambda err: print('pageerror:',err))
    pg.goto(base+'/scan-python/')
    text='password = "somente-ficticio"\nstatus = "ok"\n'
    pg.locator('#text').fill(text)
    pg.locator('#run').click()
    expect(pg.locator('#status')).to_have_text(re.compile(r'^(Análise concluída|Falha|Não foi possível|Limite de tempo)'),timeout=100000)
    assert pg.locator('#status').inner_text().startswith('Análise concluída'), pg.locator('#status').inner_text()
    assert pg.locator('#rows tr').count()==1
    assert 'SEC004' in pg.locator('#rows').inner_text()
    assert 'somente-ficticio' not in pg.locator('#rows').inner_text()
    with tempfile.TemporaryDirectory() as t:
        f=Path(t)/'texto-sintetico.txt';f.write_text(text)
        cli=json.loads(subprocess.check_output([sys.executable,str(root/'artefatos.py'),str(f),'--format','json']))
        assert cli['summary']['findings']==pg.locator('#rows tr').count()
        assert cli['findings'][0]['rule_id'] in pg.locator('#rows').inner_text()
    pg.locator('#filter').fill('inexistente')
    assert pg.locator('#rows tr').count()==0
    pg.locator('#clear').click()
    pg.locator('#files').set_input_files([{'name':'a.txt','mimeType':'text/plain','buffer':b'password = "somente-ficticio"\n'},{'name':'b.bin','mimeType':'application/octet-stream','buffer':b'abc\x00password = "example"'}])
    pg.locator('#run').click()
    expect(pg.locator('#status')).to_have_text(re.compile(r'^(Análise concluída|Falha|Não foi possível|Limite de tempo)'),timeout=100000)
    assert pg.locator('#status').inner_text().startswith('Análise concluída'), pg.locator('#status').inner_text()
    assert 'Ignorados: 1' in pg.locator('#summary').inner_text()
    assert pg.locator('#rows tr').count()==1
    pg.locator('#clear').click()
    pg.locator('#text').fill('status="ok"')
    pg.locator('#run').click();pg.locator('#cancel').click()
    assert 'Cancelado' in pg.locator('#status').inner_text()
    assert not external,external
    assert pg.evaluate('document.documentElement.scrollWidth <= innerWidth')
    b.close()
srv.shutdown()
print('Browser: equivalência com CLI, arquivo binário, filtro, cancelamento, responsividade e nenhum pedido externo observados.')
