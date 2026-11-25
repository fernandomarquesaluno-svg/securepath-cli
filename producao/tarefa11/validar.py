"""Exercita as duas páginas e confere destinos internos por arquivo e fragmento."""
import functools
import http.server
import os
import threading
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, urljoin, unquote
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[2]
class Links(HTMLParser):
    def __init__(self,filename):
        super().__init__()
        self.links=[]
        self.ids=set()
        self.feed(filename.read_text())
    def handle_starttag(self,tag,attrs):
        data=dict(attrs)
        if 'id' in data:self.ids.add(data['id'])
        if tag=='a' and 'href' in data:self.links.append(data['href'])
docs=ROOT/'docs'
for page in docs.rglob('*.html'):
    seen=set()
    for url in Links(page).links:
        u=urlsplit(urljoin(page.as_uri(),url))
        if u.scheme!='file':continue
        file=Path(unquote(u.path))
        if file.is_dir():file=file/'index.html'
        assert file.exists(),(page,url)
        if u.fragment:assert u.fragment in Links(file).ids,(page,url)
        seen.add(url)
    print(page.name,len(seen),'destinos internos distintos OK')
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=docs))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path=os.getenv('CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox','--disable-gpu'])
    for width,height in [(1440,900),(390,844)]:
        pg=b.new_page(viewport={'width':width,'height':height},reduced_motion='reduce')
        pg.route('https://**/*',lambda r:r.abort())
        pg.goto(base+'/docs/#inicio');pg.wait_for_url(base+'/#inicio')
        if width<500:
            pg.locator('#menu-button').click()
            pg.locator('#mobile-nav a[href="#scanner"]').click()
        else:pg.locator('.desktop-nav a[href="#scanner"]').click()
        pg.locator('#scanner-example').click()
        pg.locator('#scanner-scan').click()
        results=pg.locator('#scanner-results').inner_text()
        assert 'SEC004' in results and 'SEC002' in results and 'somente-ficticio' not in results
        pg.locator('#scanner-clear').click()
        pg.locator('#scanner-files').set_input_files({'name':'controle.txt','mimeType':'text/plain','buffer':b'public documentation'})
        pg.locator('#scanner-scan').click()
        pg.wait_for_function("!document.getElementById('scanner-scan').disabled")
        assert 'SEC004' not in pg.locator('#scanner-results').inner_text()
        pg.locator('#detalhes-tecnicos > summary').click()
        assert pg.locator('#detalhes-tecnicos').get_attribute('open') is not None
        assert pg.locator('.clip-scene').count()==11
        pg.locator('#clip-version').click() if pg.locator('#clip-version').is_visible() else None
        pg.locator('#clip-start').click()
        pg.wait_for_function("document.getElementById('clip-state-label').innerText.includes('AFONSO')")
        pg.locator('#clip-toggle').click()
        if pg.locator('#clip-version').is_visible():pg.locator('#clip-version').click()
        print('player MP4 visível:',pg.locator('#explainer-native').is_visible())
        assert pg.evaluate('document.documentElement.scrollWidth <= innerWidth')
        pg.goto(base+'/portfolio.html')
        pg.locator('[data-lab-category="7"]').click()
        pg.locator('[data-lab8-model="google"]').click()
        assert pg.locator('[data-lab8-model="google"]').get_attribute('aria-pressed')=='true'
        assert all(pg.locator('#atividade-'+n).count()==1 for n in '678')
        assert pg.evaluate('document.documentElement.scrollWidth <= innerWidth')
        print(width,height,'menu, scanner com texto e arquivo, detalhes, player original e portfólio OK')
        pg.close()
    b.close()
server.shutdown()
