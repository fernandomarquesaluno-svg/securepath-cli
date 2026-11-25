"""Reproduz até o evento ended; monitora legendas e passagem entre capítulos."""
import functools
import http.server
import os
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[2]/'docs'
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=root))
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path=os.getenv('CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox','--disable-gpu','--autoplay-policy=no-user-gesture-required'])
    pg=b.new_page()
    pg.route('https://**/*',lambda r:r.abort())
    pg.goto('http://127.0.0.1:'+str(server.server_port)+'/')
    video=pg.locator('#explainer-mp4')
    video.scroll_into_view_if_needed()
    video.evaluate("""v=>{
      window.seen=new Set();window.join=[];
      const tr=v.querySelector('track').track;tr.mode='showing';
      tr.addEventListener('cuechange',()=>{for(const c of tr.activeCues)seen.add(c.startTime)});
      v.addEventListener('timeupdate',()=>{if(v.currentTime>=100&&v.currentTime<=102)join.push(v.currentTime)});
      return v.play()
    }""")
    pg.wait_for_function("document.querySelector('video').ended",timeout=210000)
    data=video.evaluate("""v=>({seconds:v.duration,width:v.videoWidth,height:v.videoHeight,ended:v.ended,
    cues:window.seen.size,transitionSamples:window.join.length,mediaError:v.error,rate:v.playbackRate})""")
    print(data,flush=True)
    assert data['width']==1920 and data['height']==1080 and data['cues']==36 and data['transitionSamples']>0 and not data['mediaError']
    b.close()
server.shutdown()
