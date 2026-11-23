'use strict';

// Atlas visual do SecurePath CLI. Esta página NÃO executa o scanner Python.
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const steps = [
  {
    kicker: 'ETAPA 01 · ENTRADA', title: 'O caminho define a análise',
    description: 'A CLI recebe um arquivo ou diretório como argumento. Para diretórios, o percurso é recursivo e mantém ordenação estável.',
    bullets: ['Arquivo individual ou árvore de pastas', 'Início pelo argumento posicional CAMINHO'],
    code: 'python artefatos.py ./meu-projeto'
  },
  {
    kicker: 'ETAPA 02 · FILTROS', title: 'Os arquivos passam por verificações',
    description: 'Antes de procurar segredos, o programa ignora pastas conhecidas, links simbólicos, arquivos especiais, arquivos muito grandes e arquivos com byte NUL no início.',
    bullets: ['Ignora .git, node_modules, venv, dist, build e outras pastas previstas', 'Limite padrão: 5120 KiB (5 MiB) por arquivo', 'Bytes NUL entre os 4096 primeiros sugerem arquivo binário'],
    code: 'python artefatos.py ./meu-projeto --max-size-kib 1024'
  },
  {
    kicker: 'ETAPA 03 · DETECÇÃO', title: 'Sete padrões procuram indícios',
    description: 'Cada arquivo aceito é lido linha por linha. As sete Regex SEC001–SEC007 procuram formatos de IDs, tokens, cabeçalhos de chaves e atribuições textuais.',
    bullets: ['Um alerta por regra correspondente em cada linha', 'Leitura UTF-8 com bytes inválidos ignorados', 'Erros locais de I/O são contabilizados sem interromper todo o percurso'],
    code: 'for line in text_file:\n    for rule in RULES:\n        if rule.pattern.search(line):\n            summary.findings += 1'
  },
  {
    kicker: 'ETAPA 04 · RELATÓRIO', title: 'Resultado útil, sem expor o valor',
    description: 'O SecurePath informa regra, categoria, caminho e linha. Pode emitir texto legível ou JSON e retornar um código de saída apropriado para scripts.',
    bullets: ['A saída não reproduz o texto da credencial', '--format json gera metadados estruturados', '--fail-on-findings retorna 1 quando há alertas e não há erro de I/O'],
    code: 'python artefatos.py ./meu-projeto --format json\npython artefatos.py ./meu-projeto --fail-on-findings'
  }
];

const rules = [
  {id:'SEC001',title:'AWS Access Key ID',description:'Procura identificadores de chave de acesso AWS iniciados em AKIA, seguidos de 16 caracteres alfanuméricos maiúsculos.',example:'AKIA + 16 caracteres A–Z / 0–9',limit:'Detectar um identificador não verifica se existe uma chave válida ou uma conta associada.'},
  {id:'SEC002',title:'Bearer token',description:'Procura sequências do tipo Bearer em texto, com pelo menos 20 caracteres do conjunto aceito pela expressão.',example:'Bearer + token com 20+ caracteres',limit:'Não autentica o token, não verifica expiração e pode ignorar formatos diferentes.'},
  {id:'SEC003',title:'Cabeçalho RSA privado',description:'Encontra o cabeçalho textual legado que marca o início de certas chaves privadas RSA.',example:'-----BEGIN RSA PRIVATE KEY-----',limit:'Um cabeçalho isolado não comprova que exista material criptográfico válido.'},
  {id:'SEC004',title:'Senha ou segredo atribuído',description:'Procura atribuições entre aspas para nomes como password, passwd, pwd e secret, inclusive alguns prefixos como db_password.',example:'db_password = "valor_ficticio"',limit:'Não entende a semântica do programa nem cobre todas as maneiras de armazenar segredos.'},
  {id:'SEC005',title:'AWS Temporary Access Key ID',description:'Identifica o formato de chave de acesso temporária AWS que começa em ASIA e tem 16 caracteres adicionais.',example:'ASIA + 16 caracteres A–Z / 0–9',limit:'O formato reconhecido não confirma atividade, validade ou permissões da chave.'},
  {id:'SEC006',title:'GitHub personal access token',description:'Procura o formato clássico de token pessoal GitHub identificado pelo prefixo ghp_.',example:'ghp_ + 36 caracteres alfanuméricos',limit:'Não abrange necessariamente formatos atuais ou futuros de tokens GitHub.'},
  {id:'SEC007',title:'Cabeçalho privado PEM / OpenSSH',description:'Procura cabeçalhos comuns de chave privada genérica, EC e OpenSSH.',example:'BEGIN PRIVATE KEY / EC PRIVATE KEY / OPENSSH PRIVATE KEY',limit:'Identificar o cabeçalho não analisa a chave completa nem sua validade criptográfica.'}
];

const findingsDemo = [
  {rule_id:'SEC007',category:'Cabeçalho de chave privada PEM/OpenSSH',path:'demonstracao/chave_exemplo.txt',line:2},
  {rule_id:'SEC005',category:'AWS Temporary Access Key ID',path:'demonstracao/configuracao.py',line:2},
  {rule_id:'SEC006',category:'GitHub personal access token (clássico)',path:'demonstracao/configuracao.py',line:3},
  {rule_id:'SEC004',category:'Senha/segredo atribuído',path:'demonstracao/configuracao.py',line:4}
];
const findingsOriginal = [
  {rule_id:'SEC001',category:'AWS Access Key ID',path:'teste.txt',line:3},
  {rule_id:'SEC004',category:'Senha/segredo atribuído',path:'teste.txt',line:4},
  {rule_id:'SEC002',category:'Bearer token',path:'teste.txt',line:5},
  {rule_id:'SEC003',category:'Cabeçalho de chave RSA privada',path:'teste.txt',line:6},
  {rule_id:'SEC004',category:'Senha/segredo atribuído',path:'teste.txt',line:7}
];
const demos = {
  demo: {path:'demonstracao',examined:3,skipped:0,errors:0,findings:findingsDemo},
  original:{path:'teste.txt',examined:1,skipped:0,errors:0,findings:findingsOriginal},
  clean:{path:'demonstracao/servico.py',examined:1,skipped:0,errors:0,findings:[]}
};
const commandByOS = {
  unix:'git clone https://github.com/fernandomarquesaluno-svg/securepath-cli.git\ncd securepath-cli\npython3 -m unittest discover -s tests -v\npython3 artefatos.py demonstracao\npython3 artefatos.py demonstracao --format json',
  win:'git clone https://github.com/fernandomarquesaluno-svg/securepath-cli.git\ncd securepath-cli\npy -3 -m unittest discover -s tests -v\npy -3 artefatos.py demonstracao\npy -3 artefatos.py demonstracao --format json'
};
let currentStep = 0;
let currentRule = 0;
let currentScenario = 'demo';
let currentFormat = 'text';
let currentOS = 'unix';
let demoTimer = null;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function chooseStep(index) {
  currentStep = (index + steps.length) % steps.length;
  const step = steps[currentStep];
  $('#step-kicker').textContent = step.kicker;
  $('#step-title').textContent = step.title;
  $('#step-description').textContent = step.description;
  $('#step-example').textContent = step.code;
  $('#step-counter').textContent = String(currentStep + 1).padStart(2,'0') + ' / 04';
  const bullets = $('#step-bullets');
  bullets.replaceChildren();
  step.bullets.forEach(item => {
    const span = document.createElement('span');
    span.textContent = item;
    bullets.appendChild(span);
  });
  $$('.pipeline-node').forEach((button, idx) => {
    button.classList.toggle('selected', idx === currentStep);
    button.setAttribute('aria-pressed', String(idx === currentStep));
  });
}
$$('.pipeline-node').forEach(button => button.addEventListener('click', () => chooseStep(Number(button.dataset.step))));
$('#prev-step').addEventListener('click', () => chooseStep(currentStep - 1));
$('#next-step').addEventListener('click', () => chooseStep(currentStep + 1));

function chooseRule(index) {
  currentRule = index;
  const rule = rules[index];
  $('#rule-id').textContent = rule.id;
  $('#rule-title').textContent = rule.title;
  $('#rule-description').textContent = rule.description;
  $('#rule-example').textContent = rule.example;
  $('#rule-limitation').textContent = rule.limit;
  $('#rule-counter').textContent = String(index + 1).padStart(2,'0') + ' / 07';
  $$('.rule-card').forEach((button, idx) => {
    button.classList.toggle('active', idx === index);
    button.setAttribute('aria-pressed', String(idx === index));
  });
}
$$('.rule-card').forEach(button => button.addEventListener('click', () => chooseRule(Number(button.dataset.rule))));

function resetLab() {
  if (demoTimer !== null) { clearInterval(demoTimer); demoTimer = null; }
  const data = demos[currentScenario];
  $('#lab-command').textContent = '$ python artefatos.py ' + data.path + (currentFormat === 'json' ? ' --format json' : '');
  $('#lab-output').textContent = 'Clique em "Reproduzir análise" para visualizar os alertas.';
  $('#lab-state').textContent = 'PRONTO PARA SIMULAR';
  ['files','skipped','errors','alerts'].forEach(name => $('#count-' + name).textContent = '—');
  $('#run-demo').disabled = false;
  $('#run-label').textContent = 'Reproduzir análise';
  $('#run-icon').textContent = '▶';
}
function chooseScenario(id) {
  currentScenario = id;
  $$('.scenario').forEach(button => {
    button.classList.toggle('active', button.dataset.scenario === id);
    button.setAttribute('aria-pressed', String(button.dataset.scenario === id));
  });
  resetLab();
}
function chooseFormat(format) {
  currentFormat = format;
  $$('.format').forEach(button => {
    button.classList.toggle('active', button.dataset.format === format);
    button.setAttribute('aria-pressed', String(button.dataset.format === format));
  });
  resetLab();
}
$$('.scenario').forEach(button => button.addEventListener('click', () => chooseScenario(button.dataset.scenario)));
$$('.format').forEach(button => button.addEventListener('click', () => chooseFormat(button.dataset.format)));

function textDemoLines(data) {
  const lines = data.findings.map(f => '[ALERTA] ' + f.path + ':' + f.line + ' | ' + f.category);
  lines.push('');
  lines.push('Resumo: arquivos analisados=' + data.examined + ' | ignorados=' + data.skipped + ' | erros de I/O=' + data.errors + ' | alertas=' + data.findings.length);
  return lines;
}
function jsonDemoLines(data) {
  const output = {
    schema_version:'1.0',scanner:'SecurePath CLI',
    summary:{examined:data.examined,skipped:data.skipped,io_errors:data.errors,findings:data.findings.length},
    findings:data.findings
  };
  return JSON.stringify(output,null,2).split('\n');
}
function finishDemo(data) {
  $('#lab-state').textContent = 'SIMULAÇÃO CONCLUÍDA';
  $('#count-files').textContent = String(data.examined).padStart(2,'0');
  $('#count-skipped').textContent = String(data.skipped).padStart(2,'0');
  $('#count-errors').textContent = String(data.errors).padStart(2,'0');
  $('#count-alerts').textContent = String(data.findings.length).padStart(2,'0');
  $('#run-demo').disabled = false;
  $('#run-icon').textContent = '↻';
  $('#run-label').textContent = 'Reproduzir novamente';
}
function runDemo() {
  if (demoTimer !== null) clearInterval(demoTimer);
  const data = demos[currentScenario];
  const lines = currentFormat === 'text' ? textDemoLines(data) : jsonDemoLines(data);
  const output = $('#lab-output');
  output.textContent = '';
  $('#lab-state').textContent = 'REPRODUZINDO SAÍDA';
  $('#run-demo').disabled = true;
  $('#run-icon').textContent = '◌';
  $('#run-label').textContent = 'Simulando...';
  ['files','skipped','errors','alerts'].forEach(name => $('#count-' + name).textContent = '—');
  let position = 0;
  const appendLine = () => {
    if (position >= lines.length) {
      clearInterval(demoTimer);
      demoTimer = null;
      finishDemo(data);
      return;
    }
    output.textContent += (position ? '\n' : '') + lines[position++];
    const terminal = $('.terminal-body');
    terminal.scrollTop = terminal.scrollHeight;
  };
  if (reduceMotion) {
    output.textContent = lines.join('\n');
    demoTimer = null;
    finishDemo(data);
  } else {
    appendLine();
    demoTimer = window.setInterval(appendLine, currentFormat === 'json' ? 54 : 360);
  }
}
$('#run-demo').addEventListener('click',runDemo);

$$('.os-choice').forEach(button => button.addEventListener('click', () => {
  currentOS = button.dataset.os;
  $$('.os-choice').forEach(choice => {
    choice.classList.toggle('active', choice.dataset.os === currentOS);
    choice.setAttribute('aria-pressed', String(choice.dataset.os === currentOS));
  });
  $('#install-code').textContent = commandByOS[currentOS];
  $('#copy-command').textContent = 'Copiar ⧉';
}));
$('#copy-command').addEventListener('click',async () => {
  const button = $('#copy-command');
  try {
    await navigator.clipboard.writeText(commandByOS[currentOS]);
    button.textContent = 'Copiado ✓';
  } catch (_) {
    button.textContent = 'Selecione o texto';
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents($('#install-code'));
    selection.removeAllRanges();
    selection.addRange(range);
  }
});

const menuToggle = $('.menu-toggle');
const mobileMenu = $('#mobile-menu');
menuToggle.addEventListener('click', () => {
  const opening = mobileMenu.hidden;
  mobileMenu.hidden = !opening;
  menuToggle.setAttribute('aria-expanded', String(opening));
  menuToggle.setAttribute('aria-label', opening ? 'Fechar menu' : 'Abrir menu');
  menuToggle.textContent = opening ? '×' : '☰';
});
$$('#mobile-menu a').forEach(link => link.addEventListener('click', () => {
  mobileMenu.hidden = true;
  menuToggle.setAttribute('aria-expanded','false');
  menuToggle.setAttribute('aria-label','Abrir menu');
  menuToggle.textContent = '☰';
}));

if ('IntersectionObserver' in window && !reduceMotion) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {threshold:.08,rootMargin:'0px 0px -30px 0px'});
  $$('.reveal').forEach(el => revealObserver.observe(el));
} else {
  $$('.reveal').forEach(el => el.classList.add('visible'));
}
const mainSections = $$('.section[id]');
const sideLinks = $$('.side-nav a');
if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      sideLinks.forEach(link => {
        const active = link.getAttribute('href') === '#' + entry.target.id;
        link.classList.toggle('active',active);
        if(active) link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      });
    });
  }, {rootMargin:'-18% 0px -70% 0px',threshold:0});
  mainSections.forEach(section => navObserver.observe(section));
}
let scrollQueued = false;
function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  $('#scroll-progress').style.width = (max > 0 ? Math.min(100,Math.max(0,window.scrollY / max * 100)) : 0) + '%';
  scrollQueued = false;
}
window.addEventListener('scroll', () => {
  if(!scrollQueued) {
    scrollQueued = true;
    requestAnimationFrame(updateProgress);
  }
}, {passive:true});
window.addEventListener('resize',updateProgress,{passive:true});
updateProgress();
chooseStep(0);
chooseRule(0);
resetLab();
