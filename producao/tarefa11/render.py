"""Renderiza o palco HTML original ou o epílogo a 30 quadros/s."""
import argparse
import os
import base64
import json
import re
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("chapter", choices=["original", "epilogo"])
parser.add_argument("output")
args = parser.parse_args()
original = args.chapter == "original"
frames = 3025 if original else 1980
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path=os.environ.get("CHROMIUM", "/usr/bin/chromium"), args=["--no-sandbox","--allow-file-access-from-files","--disable-gpu"])
    page = browser.new_page(viewport={"width":960,"height":540}, device_scale_factor=2)
    page.route("https://**/*", lambda route: route.abort())
    if original:
        # Captura o DOM do player, inclusive seus keyframes e as transições entre cenas.
        page.goto((ROOT/"docs/index.html").as_uri())
        js = (ROOT/"docs/app.js").read_text()
        scenes = json.loads(re.search(r"const scenes=(\[.*?\]);", js)[1])
        page.evaluate("""scenes => {
          const stage=document.querySelector('#explainer-screen');
          document.body.replaceChildren(stage);
          stage.hidden=false; stage.style.cssText='width:960px;height:540px;position:relative';
          stage.querySelector('#clip-start-overlay').remove();
          stage.querySelector('#clip-subtitles').style.visibility='hidden';
          const nodes=[...stage.querySelectorAll('.clip-scene')];
          const animations=document.getAnimations().filter(a=>a instanceof CSSAnimation);
          animations.forEach(a=>a.pause());
          window.draw=t=>{
            const i=scenes.findLastIndex(s=>s[1]<=t);
            nodes.forEach((node,k)=>{
              node.style.transition='none'; node.classList.toggle('current',k===i);
              let w=k===i?Math.min(1,(t-scenes[i][1])/.45):k===i-1?Math.max(0,1-(t-scenes[i][1])/.45):0;
              if(i===0 && k===0) w=1;
              node.style.opacity=w;node.style.transform='scale('+(1+.025*(1-w))+')';
            });
            stage.querySelector('#clip-topic').textContent=scenes[i][0];
            animations.forEach(a=>a.currentTime=t*1000);
          };
        }""", scenes)
    else:
        page.goto((HERE/"epilogo.html").as_uri())
    if original:
        page.add_style_tag(content=".clip-code-panel code,.clip-config-grid code,.clip-config-json,.clip-config-skip{font-family:'DejaVu Sans Mono',monospace!important}.clip-code-panel code{font-size:14px;line-height:19px;flex:none}")
    cdp = page.context.new_cdp_session(page)
    import io
    from PIL import Image
    clip={"x":0,"y":0,"width":960,"height":540,"scale":1}
    def snapshot():
        data=cdp.send("Page.captureScreenshot",{"format":"jpeg","quality":90,"clip":clip,"captureBeyondViewport":True})
        return base64.b64decode(data["data"])
    width=Image.open(io.BytesIO(snapshot())).width
    clip["scale"]=1920/width
    assert Image.open(io.BytesIO(snapshot())).size == (1920,1080)
    cmd = ["ffmpeg","-v","error","-y","-f","image2pipe","-framerate","30","-c:v","mjpeg","-i","-","-an","-c:v","libx264","-threads","4","-preset","veryfast","-crf","20","-pix_fmt","yuv420p",args.output]
    with subprocess.Popen(cmd, stdin=subprocess.PIPE) as encoder:
        for n in range(frames):
            page.evaluate("t=>window.draw(t)",n/30)
            encoder.stdin.write(snapshot())
        encoder.stdin.close()
        if encoder.wait(): raise RuntimeError("FFmpeg")
    browser.close()
