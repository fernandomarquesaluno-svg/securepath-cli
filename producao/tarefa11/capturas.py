"""Registra a interface real utilizada no último plano."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
H=Path(__file__).resolve().parent
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.getenv('CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox','--disable-gpu'])
    page=b.new_page(viewport={'width':1360,'height':800},reduced_motion='reduce')
    page.route('https://**/*',lambda r:r.abort())
    for page_name,output in [('index','inicio'),('portfolio','portfolio')]:
        page.goto((H.parents[1]/f'docs/{page_name}.html').as_uri())
        page.add_style_tag(content='.rise,.reveal{opacity:1!important;transform:none!important}')
        page.screenshot(path=str(H/f'{output}.jpg'),quality=90)
    b.close()
