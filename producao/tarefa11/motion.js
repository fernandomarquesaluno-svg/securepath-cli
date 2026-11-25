/* Um fio percorre o mapa, atravessa o arquivo e termina na marca do projeto. */
const canvas = document.querySelector('canvas'), g = canvas.getContext('2d');
const lime='#B8FF66', cyan='#7CE7F7', lilac='#A89AFC', ink='#080D15', white='#F2F5EF', muted='#99ADB9';
const clamp = x => Math.max(0, Math.min(1,x));
const ease = x => {x=clamp(x); return x*x*(3-2*x)};
const home=new Image(), portfolio=new Image();
home.src='inicio.jpg';portfolio.src='portfolio.jpg';
function txt(value,x,y,size,color=white,weight=600,family='Space Grotesk'){
  g.fillStyle=color;g.font=weight+' '+size+'px "'+family+'", sans-serif';g.fillText(value,x,y);
}
function shape(x,y,w,h,r,fill,stroke){
  g.beginPath();g.roundRect(x,y,w,h,r);
  if(fill){g.fillStyle=fill;g.fill()} if(stroke){g.lineWidth=1;g.strokeStyle=stroke;g.stroke()}
}
function path(points,color,width=2){
  g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
  g.strokeStyle=color;g.lineWidth=width;g.lineJoin='round';g.lineCap='round';g.stroke();
}
function dot(x,y,r,c){g.beginPath();g.arc(x,y,r,0,2*Math.PI);g.fillStyle=c;g.fill()}
function wire(x,y,X,Y,p,c){
  p=clamp(p);let pts=[];for(let i=0;i<=32;i++){let u=p*i/32;pts.push([x+(X-x)*u,y+(Y-y)*ease(u)])}
  path(pts,c,1.6);dot(...pts.at(-1),3,c)
}
function appear(t,delay,fn){
  let a=ease((t-delay)/.7);if(!a)return;g.save();g.globalAlpha*=a;g.translate(0,(1-a)*16);fn();g.restore()
}
function heading(tag,line){txt(tag,60,65,13,cyan,650);txt(line,57,128,48,white,700)}
function paper(x,y,w,h,angle,title,lines,c='#E2E4D4'){
  g.save();g.translate(x,y);g.rotate(angle);g.shadowColor='#0008';g.shadowBlur=15;
  shape(0,0,w,h,3,c);g.shadowBlur=0;shape(14,14,22,5,1,'#46634C');
  txt(title,14,43,17,ink,700);lines.forEach((v,i)=>txt(v,14,71+i*23,14,'#354249',550,'DM Sans'));g.restore()
}
function origin(t){
  heading('CADERNO DE PROJETO   /   ORIGEM','Antes do primeiro commit.');
  g.save();g.translate(10*Math.sin(t*.2),-t*.42);
  const notes=[[66,217,'config.py',['arquivo local','senha atribuída'],-.055],[335,267,'Publicar código',['revisão manual','o que escapou?'],.046],[630,203,'SecurePath',['buscar padrões','indicar a linha'],-.028]];
  notes.forEach(([x,y,title,lines,r],i)=>{
    if(i)wire(x-125,y+85,x+3,y+44,(t-i*2+.4)/1.4,i===2?lime:cyan);
    appear(t,.3+i*2,()=>paper(x,y,199,121,r,title,lines,i===2?lime:'#D9E2DF'))
  });
  if(t>6)appear(t,6,()=>txt('Encontrar a credencial antes da publicação.',138,447,28,lime));
  g.restore()
}
function code(t){
  heading('PROTÓTIPO   /   PYTHON','O arquivo fica na máquina.');
  shape(70,168,590,220,12,'#10202C','#42616B');
  txt('artefatos.py',95,198,17,cyan);path([[90,215],[635,215]],'#344A56',1);
  ['for rule in rules:','    if rule.pattern.search(line):','        summary.findings += 1'].forEach((line,i)=>{
    const chars=Math.floor(Math.max(0,t-.12-i*.6)*33);
    txt(line.slice(0,chars),97,255+i*40,21,i===1?lime:white,550,'DM Sans')
  });
  wire(650,281,706,260,t/1.6,cyan);
  appear(t,.6,()=>{paper(690,200,210,146,.045,'Relatório local',['arquivo e linha','categoria','valor oculto'], '#CCDED9')});
  txt('Biblioteca padrão do Python',75,435,23,muted)
}
function tests(t){
  heading('VALIDAÇÃO   /   REGRESSÃO','Da regra ao teste.');
  const count=Math.floor(69*ease(t/2.6));
  for(let i=0;i<69;i++){let x=65+i%23*16,y=211+Math.floor(i/23)*19;shape(x,y,11,12,2,i<count?lime:'#243642')}
  txt(String(count),61,365,100,lime,700);txt('testes aprovados',195,348,25);
  path([[449,228],[485,228],[485,359]],'#385458');
  ['Regras JSON e exclusões','Fila de trabalho paralela','Arquivos no navegador'].forEach((v,i)=>{
    wire(485,235+i*60,531,235+i*60,(t-.55*i)/.7,cyan);
    appear(t,.55*i,()=>{shape(536,209+i*60,349,49,8,'#142631','#37515D');txt(v,554,241+i*60,22,white)})
  })
}
function review(t){
  if(t<10.65){
    heading('AVALIAÇÃO   /   PROCESSOS','Que evidência conta?');
    const labels=[['SBSeg',['revisão inicial','resposta e reavaliação']],['USENIX Security',['disponibilidade','avaliação facultativa']],['MODELS',['submissão à trilha','critérios do evento']]];
    labels.forEach(([a,b],i)=>{appear(t,i*.75,()=>{let x=70+285*i;paper(x,202+Math.sin(t*.6+i)*6,236,140,(i-1)*.035,a,b,i===1?'#DAD5ED':'#D7E2DF');wire(x+118,348,475,408,(t-i*.65-1)/2,lilac)})});
    appear(t,3,()=>txt('Critérios para ler um parecer',320,443,24,lilac))
  }else{
    let s=t-10.65, audited=s>12;
    heading('K-AGENT   /   '+(audited?'ROBUSTEZ DOS PARECERES':'LEITURA E EXECUÇÃO'),audited?'O parecer se mantém?':'Do documento à execução.');
    ['GPT','Gemini','Claude'].forEach((v,i)=>{
      const y=197+i*66;appear(s,i*.20,()=>{shape(70,y,139,44,22,'#142732','#405864');txt(v,91,y+29,20,cyan);wire(209,y+22,340,279,(s-i*.2)/1.5,cyan)})
    });
    appear(s,.65,()=>paper(320,210,231,146,-.027,audited?'Mesmo relato':'Parecer',['instruções + código','confrontar com logs'], '#E1DDF1'));
    const y=audited?207:197;
    wire(550,278,625,y+18,(s-1.2)/1.2,lilac);wire(550,278,625,y+104,(s-1.6)/1.2,lilac);
    appear(s,1.3,()=>{txt(audited?'Condições variadas':'Funcionalidade',634,y+22,24,lime);txt(audited?'pareceres variaram':'execução registrada',634,y+48,17,muted,500,'DM Sans')});
    appear(s,1.8,()=>{txt(audited?'Limite da análise':'Reprodutibilidade',634,y+108,24,lilac);txt(audited?'causa indeterminada':'comparação pendente',634,y+134,17,muted,500,'DM Sans')});
    txt('Pareceres das atividades 7 e 8 · Portfólio LEAS',74,438,18,muted)
  }
}
function closing(t){
  if(t<9.3){
    heading('PORTFÓLIO   /   LEAS','O percurso fica documentado.');
    const frames=[[home,60,168,-.035],[portfolio,450,218,.035]];
    frames.forEach(([im,x,y,r],i)=>appear(t,i*.8,()=>{g.save();g.translate(x+Math.sin(t*.45+i)*8,y);g.rotate(r);
      shape(-3,-3,453,251,8,'#28404B',i?lilac:lime);
      if(im.naturalWidth)g.drawImage(im,0,0,447,245);g.restore()}))
  }else{
    let s=t-9.3;
    g.save();g.translate(450,164);let p=clamp(s/.8);
    const pts=[[0,-45],[38,-30],[35,4],[23,28],[0,44],[-23,28],[-35,4],[-38,-30],[0,-45]];
    path(pts.slice(0,Math.max(2,Math.ceil(p*pts.length))),lime,3);
    if(p===1)path([[-15,-1],[-4,10],[17,-13]],lime,4);g.restore();
    appear(s,.25,()=>{txt('SecurePath',227,293,89,white,700);txt('— Da ideia à evidência.',247,354,39,lime,600)});
    txt('Fernando Marques  /  LEAS · UNIPAMPA',298,420,17,muted,500,'DM Sans')
  }
}
const cuts=[0,10.15,14.35,21.50,50.89], scenes=[origin,code,tests,review,closing];
function draw(t){
  g.setTransform(2,0,0,2,0,0);g.fillStyle=ink;g.fillRect(0,0,960,540);
  const grad=g.createRadialGradient(610+70*Math.sin(t*.15),271,0,570,270,560);
  grad.addColorStop(0,'#132C36');grad.addColorStop(1,ink);g.fillStyle=grad;g.fillRect(0,0,960,540);
  for(let i=0;i<115;i++){let x=(i*137.3+t*(i%3+1)*.8)%965,y=(i*73.03)%543;dot(x,y,i%5===0?1.4:.75,'#64878B66')}
  let i=cuts.findLastIndex(c=>t>=c),local=t-cuts[i];
  g.save();g.globalAlpha=ease((local+.05)/.5)*(i<4?1-ease((t-cuts[i+1]+.32)/.32):1);g.translate(14*(1-g.globalAlpha),0);scenes[i](local);g.restore();
  shape(60,487,840,2,1,'#293A43');shape(60,487,Math.max(.1,840*t/66),2,1,lime)
}
window.draw=draw;draw(0)
