"""Gera o complemento em Faber pt-BR e alinha legendas às tomadas individuais."""
import json
import sys
import subprocess
import tempfile
import wave
from pathlib import Path
import numpy as np
from piper import PiperVoice
from scipy.io import wavfile

HERE=Path(__file__).resolve().parent
TEXT=[
 "Mas o SecurePath não nasceu pronto.",
 "Tudo começou com um mapa mental: como encontrar credenciais expostas antes de publicar código?",
 "A ideia virou um protótipo em Python.",
 "Revisamos as regras, registramos testes",
 "e evoluímos para um scanner configurável, com demonstração no navegador.",
 "Então surgiu outra pergunta: como saber se um artefato realmente merece confiança?",
 "Comparamos processos de avaliação de eventos científicos.",
 "Depois, usamos diferentes modelos de inteligência artificial para avaliar o K-Agent,",
 "confrontando pareceres e evidências de funcionalidade e reprodutibilidade.",
 "Ao variar as condições da avaliação, investigamos a consistência desses resultados.",
 "O portfólio reúne essa trajetória.",
 "Mais do que construir software, aprendemos a justificar decisões,",
 "documentar limites e sustentar conclusões com evidências."
]
def stamp(t):
    ms=round(t*1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'
def build(model):
    voice=PiperVoice.load(model)
    takes=[]
    with tempfile.TemporaryDirectory() as temp:
        p=Path(temp)/'take.wav'
        for line in TEXT:
            with wave.open(str(p),'wb') as f:
                voice.synthesize_wav(line.replace('SecurePath','Secúr Péth').replace('K-Agent','Kê Êidjent').replace('Python','Páiton'),f)
            rate,data=wavfile.read(p)
            active=np.flatnonzero(np.abs(data.astype(float))>75)
            takes.append(data[max(0,active[0]-600):active[-1]+1100])
    gap=.20
    speed=sum(map(len,takes))/rate/(62-gap*(len(takes)-1))
    out=np.zeros(66*rate,dtype=np.int16)
    pos=round(.7*rate)
    cues=[]
    for line,take in zip(TEXT,takes):
        raw=subprocess.run(['ffmpeg','-v','error','-f','s16le','-ar',str(rate),'-ac','1','-i','pipe:','-af',f'atempo={speed}','-f','s16le','pipe:'],input=take.tobytes(),capture_output=True,check=True).stdout
        data=np.frombuffer(raw,dtype=np.int16)
        out[pos:pos+len(data)]=data
        cues.append([pos/rate,(pos+len(data))/rate,line])
        pos+=len(data)+round(gap*rate)
    wavfile.write(HERE/'faber.wav',rate,out)
    subprocess.run(["ffmpeg","-v","error","-y","-i",str(HERE/"faber.wav"),str(HERE/"faber.flac")],check=True)
    (HERE/"faber.wav").unlink()
    (HERE/'falas.json').write_text(json.dumps(cues,ensure_ascii=False,indent=2)+'\n')
    media=HERE.parents[1]/'docs/media'
    vtt=(media/'securepath-v2-ptbr.vtt').read_text().rstrip()+'\n\n'
    for start,end,line in cues:
        vtt+=f'{stamp(3025/30+start)} --> {stamp(3025/30+end)}\n{line}\n\n'
    (media/'securepath-semestre.vtt').write_text(vtt)
if __name__=='__main__': build(sys.argv[1])
