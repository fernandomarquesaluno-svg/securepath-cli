# Revisão crítica do artefato por IA — 04/11/2026

## Escopo e evidências

Revisão do repositório público `fernandomarquesaluno-svg/securepath-cli`, do relato anexo em PDF e do enunciado fornecido pelo aluno. A avaliação usou os quatro critérios indicados na tarefa e verificou o script original, o README original, o relato e a base de teste. As diretrizes SBSeg servem de referência acadêmica; não se afirma que o comitê avaliou este artefato.

## Situação inicial encontrada

| Critério | Evidência | Lacuna corrigida ou registrada |
|---|---|---|
| Disponibilidade | Repositório público com `artefatos.py`, `README.md`, `relato.txt` e `teste.txt` | README truncado; ausência de licença explícita |
| Funcionalidade | Código original continha padrões AWS, Bearer, RSA e atribuição de senha | Erros agrupados em `except Exception`, sem teste formal e sem política clara de arquivos binários |
| Sustentabilidade | Script original importava apenas módulos nativos | Organização/documentação, critérios de exclusão e tratamento de erros mais explícitos |
| Reprodutibilidade | Arquivo `teste.txt` oferecia valores fictícios | O arquivo misturava Markdown e dados; faltava suíte automática e saídas esperadas |

## Modificações propostas e incorporadas no pacote

1. Reorganização em `scan_file`, `scan_directory` e `main`, com estrutura `Summary` de métricas.
2. `PermissionError` e `OSError` tratados sem capturar toda e qualquer exceção inesperada, contabilizando falhas de I/O.
3. Leitura UTF-8 `errors='ignore'`; detecção **heurística** de binários por byte NUL; limite padrão de 5 MiB por arquivo.
4. Saídas apenas com caminho, linha e categoria do indício. Nenhuma credencial é impressa.
5. Novos testes automatizados apenas com `unittest` e dataset sintético documentado.
6. README com todos os itens obrigatórios do enunciado; notas explícitas sobre falsos positivos, falsos negativos e exclusões de arquivos.
7. Roteiro de apresentação e relato de IA com seis seções exigidas pelo docente.
8. Licença MIT adotada no arquivo LICENSE, publicada junto ao código.

## Comandos e resultados de teste local

Ambiente verificado: Linux, Python 3.13.5, 04/11/2026.

```console
$ python -m unittest discover -s tests -v
Ran 9 tests in 0.030s
OK

$ python artefatos.py teste.txt --fail-on-findings
[ALERTA] teste.txt:3 | AWS Access Key ID
[ALERTA] teste.txt:4 | Senha/segredo atribuído
[ALERTA] teste.txt:5 | Bearer token
[ALERTA] teste.txt:6 | Cabeçalho de chave RSA privada
[ALERTA] teste.txt:7 | Senha/segredo atribuído

Resumo: arquivos analisados=1 | ignorados=0 | erros de I/O=0 | alertas=5
$ echo $?
1
```

O código `1` é esperado na presença de alertas com `--fail-on-findings`. Erro de I/O produz código `2`.

## Limitações remanescentes e validação acadêmica

- Confirmação histórica dos modelos de IA: o PDF fornecido e o relato já publicado no GitHub divergem sobre os modelos utilizados. A divergência foi registrada explicitamente na seção 2 do `relato.txt`, sem alegar certeza sobre versões históricas não verificadas. O aluno poderá complementar com seus logs originais.
- Testar manualmente em Windows/macOS e com permissões de sistema reais, caso haja disponibilidade de ambiente.
- O algoritmo é baseado em Regex, não em análise semântica nem validação de credenciais. Os números do teste sintético não devem ser generalizados como precisão, recall ou detecção em repositórios reais.
- A política de binários, pastas excluídas, limite de tamanho e `errors='ignore'` pode deixar conteúdo sem análise. Por isso, o resultado negativo não é prova de ausência de segredos.

## Conclusão técnica

Há evidência local de funcionamento e reprodução do protocolo sintético, com melhorias de manutenção e documentação. Não há base para garantir nota máxima, atribuição formal de selo ou desempenho em aplicações reais; isso exige avaliação independente do docente e eventual ampliação experimental.


## Revisão pós-publicação de 05/11/2026

ChatGPT/Codex (OpenAI) conferiu o estado público e os quatro critérios. A execução atual confirmou os nove testes preexistentes. Foi identificada a possibilidade de bloqueio ao abrir FIFO durante varredura de diretório. A verificação de arquivo regular corrigiu esse cenário; dois testes adicionais cobrem FIFO real e link simbólico. Resultado: 11 testes OK em Python 3.12.14/Linux. Demonstração: 5 alertas, código 1 com a flag correspondente. Veja [log real](evidencias/validacao_2026-11-05.txt).

D: arquivos acessíveis. F: comportamentos testados confirmados. S: funções separadas, biblioteca padrão e regressões. R: repetição da amostra e da suíte documentada; sem alegação de benchmark científico ou validação de corpus real.

Pendência acadêmica: resolver a atribuição histórica dos modelos e confirmar a participação do aluno. Prompts reconstruídos são exemplos de documentação, não transcrições. Não foram realizados testes de ACL real ou validação em Windows/macOS.
