# SecurePath CLI — Scanner de possíveis credenciais expostas

**SecurePath CLI** é uma ferramenta de linha de comando para análise estática local de arquivos e diretórios. Identifica **indícios** de credenciais expostas por expressões regulares, sem enviar conteúdo à rede e sem dependências externas: utiliza somente a **Python Standard Library**.

**Repositório:** https://github.com/fernandomarquesaluno-svg/securepath-cli  

**Conferência da Atividade 3:** [matriz de entregáveis, evidências e pendências](AUDITORIA_ENTREGAVEIS_TAREFA3.md).  
**Roteiro revisado da apresentação:** [dez slides](ROTEIRO_APRESENTACAO.md).  
**Contexto:** artefato educacional de Cibersegurança desenvolvido com assistência de IA. Não equivale a um scanner corporativo completo nem comprova, isoladamente, que uma credencial esteja ativa.

## 1. Descrição do problema

Credenciais, tokens e chaves privadas podem ser inseridos acidentalmente no código-fonte ou em arquivos de configuração. Se publicados, esses dados podem viabilizar acesso não autorizado. A detecção precoce por análise estática reduz o risco de exposição, embora não substitua controles preventivos e revisão humana.

## 2. Motivação

Ferramentas de segurança podem depender de ambientes complexos. Um scanner mínimo, auditável, offline e desenvolvido exclusivamente com a biblioteca padrão do Python facilita instalação, inspeção do código e reprodução em ambientes acadêmicos. **Zero dependências não significa zero riscos ou desempenho garantido**; a decisão é uma escolha de arquitetura a ser avaliada por testes.

## 3. Objetivo do artefato

Percorrer um arquivo ou uma árvore de diretórios, localizar padrões suspeitos de credenciais, reportar caminho, linha e categoria do indício **sem exibir o valor**, e continuar processando outros arquivos na presença de falhas isoladas de entrada/saída (I/O).

## 4. Principais funcionalidades

- Identifica IDs de chave de acesso AWS com prefixo `AKIA` e 16 caracteres alfanuméricos maiúsculos adicionais.
- Identifica tokens em cabeçalhos `Bearer` com comprimento mínimo configurado no padrão.
- Reconhece cabeçalhos PEM do formato legado de chave privada RSA.
- Identifica atribuições textuais de `password`, `passwd`, `pwd`, `secret` e variantes com prefixo, como `db_password`.
- Percorre diretórios recursivamente, em ordem estável, ignorando pastas de ferramentas/geração (`.git`, `.venv`, `venv`, `__pycache__`, `.pytest_cache`, `node_modules`, `dist`, `build`).
- Não segue links simbólicos; ignora arquivos especiais (FIFO, socket e dispositivo), arquivos que excedam o limite de tamanho (padrão: **5 MiB**) ou cujo início contenha byte NUL (heurística para binário).
- Utiliza leitura UTF-8 com `errors='ignore'` e `try/except` específico para `PermissionError` e `OSError`; conta arquivos analisados, ignorados, erros e alertas.
- Oferece a opção `--fail-on-findings` para integração em scripts/CI.

**Proteção na saída:** a ferramenta apresenta metadados do alerta, **não a linha original nem o conteúdo da credencial**.

## 5. Dependências

**Zero dependências de terceiros:** nenhum `pip install`, `requirements.txt`, `click`, `rich`, `colorama` ou serviço externo é necessário. Módulos utilizados: `argparse`, `dataclasses`, `os`, `pathlib`, `re`, `stat` e `sys`. Os testes usam também `unittest`, `unittest.mock`, `tempfile`, `contextlib` `io`, `subprocess` e `sys`, todos nativos.

## 6. Requisitos de execução

- **Python 3.9 ou superior** (testado localmente em Python **3.13.5**, Linux, em 04/11/2026).
- Windows, Linux ou macOS com interpretador Python compatível; **execução em Windows/macOS não foi verificada nesta revisão**.
- Permissão de leitura nos arquivos a analisar; acesso à rede não é exigido para executar o scanner.
- Baixo consumo esperado para arquivos comuns; o limite de 5 MiB por arquivo restringe a memória exigida por uma linha excepcionalmente longa, mas não constitui benchmark de consumo.

## 7. Instruções de instalação

```bash
git clone https://github.com/fernandomarquesaluno-svg/securepath-cli.git
cd securepath-cli
python --version
```

Alternativamente, baixe os arquivos do repositório. O Git é necessário apenas para clonagem, **não para executar** o script. No Windows, se `python` não funcionar, experimente `py -3` no lugar de `python`.

## 8. Instruções de execução

```bash
python artefatos.py CAMINHO
python artefatos.py CAMINHO --max-size-kib 1024
python artefatos.py CAMINHO --fail-on-findings
python artefatos.py --help
```

`CAMINHO` pode ser um arquivo ou diretório. `--max-size-kib` define o máximo por arquivo em KiB (inteiro positivo; padrão 5120).

**Códigos de saída:** `0` = varredura sem erros de I/O (mesmo com alertas, se não usar `--fail-on-findings`); `1` = alertas presentes com `--fail-on-findings`; `2` = erro de I/O ou erro de argumentos. Erros de I/O têm prioridade sobre alertas, pois a análise ficou parcial.

## 9. Exemplos de uso

Analisar a base sintética:

```bash
python artefatos.py teste.txt
```

**Saída esperada** para o arquivo sintético fornecido:

```text
[ALERTA] teste.txt:3 | AWS Access Key ID
[ALERTA] teste.txt:4 | Senha/segredo atribuído
[ALERTA] teste.txt:5 | Bearer token
[ALERTA] teste.txt:6 | Cabeçalho de chave RSA privada
[ALERTA] teste.txt:7 | Senha/segredo atribuído

Resumo: arquivos analisados=1 | ignorados=0 | erros de I/O=0 | alertas=5
```

Varredura de um projeto local e bloqueio de pipeline quando há alertas:

```bash
python artefatos.py ./meu-projeto --fail-on-findings
```

**Atenção:** para testes automatizados, valide o código de saída em vez de interpretar apenas o texto do terminal.

## 10. Estrutura do repositório

```text
securepath-cli/
├── artefatos.py              # Scanner e interface CLI
├── teste.txt                 # Base de validação 100% sintética
├── tests/
│   └── test_artefatos.py     # Testes unitários com unittest
├── README.md                 # Documentação e protocolo de reprodução
├── relato.txt                # Histórico crítico do desenvolvimento com IA
├── ROTEIRO_APRESENTACAO.md   # Texto de fala por slide
├── REVISAO_IA.md             # Auditoria e evidências da revisão
├── .gitignore
└── LICENSE                   # Licença MIT
```

`artefatos.py` separa os padrões (`PATTERNS`), os contadores (`Summary`), a análise de arquivo (`scan_file`), o percurso recursivo (`scan_directory`) e a entrada da CLI (`main`).

## 11. Testes e dataset sintético

O arquivo `teste.txt` contém **somente dados fictícios**: um exemplo AWS de teste, duas atribuições de senha, um cabeçalho Bearer e um cabeçalho RSA, além de um controle negativo. **Não utilize credenciais reais na base de demonstração.**

Protocolo de reprodução:

```bash
python -m unittest discover -s tests -v
python artefatos.py teste.txt
python artefatos.py teste.txt --fail-on-findings
```

**Resultados esperados:** 11 testes `OK`, 5 alertas no `teste.txt`, 0 erros de I/O. No último comando, a saída é a mesma, mas o processo termina com código `1`, intencionalmente.

A suíte cobre: achados sintéticos e não exposição do conteúdo; arquivo limpo; arquivo binário com NUL; leitura de texto fora de UTF-8; arquivo acima do limite; exclusão de `.git`; erro de permissão simulado; caminho inexistente; erro simulado de travessia de diretório com continuação. O teste de permissões **simula** a exceção e não equivale a um teste de ACL real em todos os sistemas operacionais.

**Evidência de revisão local em 04/11/2026:** Python 3.13.5, Linux, 9 testes aprovados. Consulte `REVISAO_IA.md` para o diagnóstico e as decisões de correção.

## 12. Limitações conhecidas

- Os padrões Regex são **heurísticos**: podem produzir falsos positivos e falsos negativos; não validam se uma chave está ativa.
- A identificação AWS contempla IDs `AKIA`, não todos os formatos de credenciais AWS (por exemplo, `ASIA`). A análise RSA reconhece apenas cabeçalhos legados `RSA PRIVATE KEY`.
- O scanner não interpreta AST, contexto semântico, formatos de arquivos compactados, histórico Git, segredos divididos entre linhas ou arquivos criptografados.
- A opção `errors='ignore'` descarta bytes inválidos silenciosamente; facilita continuidade de I/O, mas pode **ocultar padrões** em conteúdos com codificação incompatível. Um byte NUL nos primeiros 4096 bytes faz o arquivo ser ignorado, mas nem todo binário contém NUL.
- Pastas excluídas, arquivos muito grandes e links simbólicos não são varridos; portanto, **um resultado sem alertas não demonstra ausência de segredos**.
- O contador representa **um alerta por tipo de padrão por linha** (mesmo que a mesma linha contenha várias ocorrências daquele tipo), não quantidade verificada de credenciais válidas.
- Arquivos com nomes sensíveis podem expor informação no **caminho exibido**. Execute em diretórios de confiança e não publique saídas de projetos privados.
- O scanner não revoga, remove, valida ou corrige credenciais. Em caso de exposição real, siga o procedimento de resposta a incidentes e rotacione as chaves afetadas.

## 13. Referências

- SBSeg 2026 — Avaliação de Artefatos: https://doc-artefatos.github.io/sbseg2026/
- Python — The Python Standard Library: https://docs.python.org/3/library/
- Python — `argparse`: https://docs.python.org/3/library/argparse.html
- Python — `re`: https://docs.python.org/3/library/re.html
- Python — `unittest`: https://docs.python.org/3/library/unittest.html
- MITRE CWE-798 — Use of Hard-coded Credentials: https://cwe.mitre.org/data/definitions/798.html
- OWASP Secrets Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html

## Avaliação do artefato pelos quatro critérios

| Critério | Evidência oferecida |
|---|---|
| **Disponibilidade** | Repositório público, código, README, dataset, testes e licença |
| **Funcionalidade** | Execução mínima reproduzível com cinco alertas sintéticos e testes unitários |
| **Sustentabilidade** | Código curto, módulos nativos, funções separadas e comportamento/limitações documentados |
| **Reprodutibilidade** | Protocolo com comandos, versões, dados sintéticos e saídas previstas |

Estes são **elementos de evidência acadêmica**, não uma atribuição oficial de selos pelo comitê do SBSeg.

## Licença

Distribuído sob a licença MIT; consulte `LICENSE`.

## Validação complementar de 05/11/2026

A revisão pós-publicação executou 11 testes em Python 3.12.14/Linux, todos aprovados. O teste mínimo produziu 5 alertas e código 1 com `--fail-on-findings`, conforme esperado. Log: [evidencias/validacao_2026-11-05.txt](evidencias/validacao_2026-11-05.txt).

A proteção adicionada rejeita arquivos não regulares antes da abertura, evitando bloqueio por FIFO. Foram testados um FIFO real em subprocesso com timeout e a exclusão de link simbólico. Em plataformas sem esses recursos, os respectivos testes podem ser ignorados e devem ser reportados como tal. O scanner não protege contra alteração maliciosa concorrente do sistema de arquivos entre a inspeção e a abertura.

### Critérios e reivindicações verificáveis

Este trabalho considera Disponibilidade, Funcionalidade, Sustentabilidade e Reprodutibilidade como critérios acadêmicos. Não há artigo associado nem concessão de selos SBSeg ao SecurePath. A reprodução demonstrada refere-se aos testes sintéticos abaixo.

| Reivindicação limitada | Procedimento | Resultado esperado |
|---|---|---|
| Detectar os padrões da amostra | `python artefatos.py teste.txt --fail-on-findings` | 5 alertas, sem valores dos segredos, código 1 |
| Distinguir arquivo limpo de indícios | Suíte `unittest` | Controle negativo sem alertas e código 0 |
| Continuar após falha local de I/O | Teste com exceção simulada | Erro contabilizado, outros arquivos analisados, código 2 |
| Evitar leitura bloqueante de FIFO | Teste POSIX em subprocesso | FIFO ignorado, processo termina antes do timeout |

Os testes desta revisão terminaram em menos de um segundo neste ambiente; isso não é benchmark nem garantia para outras máquinas. Não há necessidade de GPU ou serviços externos. O uso de memória e disco não foi medido. O limite de tamanho por arquivo é 5 MiB, configurável.

### Preocupações com segurança

Execute apenas sobre arquivos que você tem autorização para ler e use a amostra sintética na avaliação. A ferramenta não modifica os arquivos nem acessa rede; caminhos dos arquivos aparecem na saída. Diretórios ignorados não são contabilizados como arquivos ignorados. Validação em Windows/macOS e avaliação de precisão/recall em corpus real permanecem fora do escopo.

### Pendências do relato acadêmico

O relato diferencia anotações históricas de evidência desta revisão. O aluno ainda deve confirmar os modelos exatos e os prompts originais, revisar a reflexão em suas próprias palavras e reproduzir os comandos. A assistência atual não comprova retroativamente decisões ou testes realizados pelo aluno.

## Atualização funcional — 05/11/2026

A versão mais recente amplia o scanner para **sete regras heurísticas (SEC001–SEC007)** e **16 testes automatizados**. Acrescenta identificadores AWS temporários (`ASIA`), tokens GitHub clássicos (`ghp_`) e cabeçalhos de chave privada PEM/OpenSSH, sem alterar os padrões anteriores. Há também um formato estruturado de relatório JSON, que inclui categoria, caminho, linha e ID da regra, **sem revelar o valor detectado**.

```bash
python -m unittest discover -s tests -v
python artefatos.py demonstracao
python artefatos.py demonstracao --format json
python artefatos.py teste.txt --fail-on-findings
```

A pasta `demonstracao/` contém somente dados artificiais: **4 alertas esperados em 3 arquivos analisados**. O arquivo `teste.txt` original continua produzindo **5 alertas**. A saída `--format json` pode ser utilizada em automações, mas expõe nomes e caminhos dos arquivos analisados; não publique resultados de projetos privados.

Os resultados históricos de **11 testes** continuam documentados como evidência da versão anterior, não do estado atual. Na atualização de 05/11, a extensão foi verificada em cópia local Linux/Python 3.13.5, com **16 testes aprovados**; a validação em Windows segue pendente. Consulte [Evolução técnica](EVOLUCAO_TECNICA.md), [guia de execução](GUIA_EXECUCAO_E_ENTREGA.md), [relato](relato.txt) e [prompts](PROMPTS_REGISTRADOS.md). A IA original confirmada foi Gemini 1.5 Pro; a extensão é da revisão posterior com GPT-6.
