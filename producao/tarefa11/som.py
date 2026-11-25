"""Síntese original: arpejador, pad, pulso, foley e assinatura em ré."""
from pathlib import Path
import subprocess
import numpy as np

HERE=Path(__file__).resolve().parent
RATE=44100
rng=np.random.default_rng(11)
music=np.zeros((66*RATE,2))
fx=np.zeros_like(music)
def note(track,start,seconds,freq,level,kind='pad',pan=0):
    offset=round(start*RATE)
    n=min(round(seconds*RATE),len(track)-offset)
    if n<1:return
    t=np.arange(n)/RATE
    if kind=='pad':
        wave=(np.sin(2*np.pi*freq*t)+.26*np.sin(2*np.pi*freq*1.004*t))*.8
        env=np.sin(np.pi*np.arange(n)/n)**1.7
    elif kind=='air':
        wave=np.sin(2*np.pi*(freq*t+230*t*t))*np.sin(2*np.pi*3*t)
        env=np.sin(np.pi*np.arange(n)/n)**2
    elif kind=='key':
        wave=rng.uniform(-1,1,n)*.5+np.sin(2*np.pi*freq*t)*.35
        env=np.exp(-t*75)*np.minimum(1,t/.002)
    else:
        wave=np.sin(2*np.pi*freq*t)+.20*np.sin(4*np.pi*freq*t)
        env=np.exp(-5*t/seconds)*np.minimum(1,t/.012)
    track[offset:offset+n]+=level*(wave*env)[:,None]*np.sqrt([(1-pan)/2,(1+pan)/2])
chords=[(146.83,174.61,220),(130.81,164.81,196),(116.54,146.83,174.61),(130.81,164.81,196)]
beat=.625
for bar in range(26):
    start=bar*beat*4
    chord=chords[(bar//2)%4]
    for i,f in enumerate(chord):
        note(music,start,3.65,f,.038,'pad',(-.65,0,.65)[i])
    for i in range(8):
        note(music,start+i*beat/2,.45,chord[(i+bar)%3]*2,.014+bar*.00045,'pluck',.4*(-1)**i)
for i in range(32):note(fx,10.55+i*.077,.075,880+rng.uniform(-160,160),.07,'key',.15)
for t in [1,2.8,4.7,14.8,16.95,19.2,28,32.5,38.6,44.4,52]:
    note(fx,t,.29,587.33,.065,'pluck');note(fx,t+.10,.32,880,.045,'pluck',.35)
for t in [9.6,13.95,21,31.7,44,50.3,59.5]:note(fx,t,.59,160,.060,'air',-.3)
for t,f in [(62.6,293.66),(63.0,440),(63.45,587.33)]:note(fx,t,1.66,f,.11,'pluck')
for name,track in [('trilha',music),('efeitos',fx)]:
    track[-RATE:]*=np.linspace(1,0,RATE)[:,None]
    subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','2','-i','pipe:','-c:a','aac','-b:a','144k',str(HERE/(name+'.m4a'))],input=track.astype('<f4').tobytes(),check=True)
