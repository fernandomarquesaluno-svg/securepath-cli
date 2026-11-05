# Registro dos prompts — Atividade 3

**Modelo original confirmado pelo aluno:** Google Gemini 1.5 Pro (05/11/2026).  
**Revisão posterior:** ChatGPT (GPT-6), 04–05/11/2026.

## Rastreabilidade

Os três exemplos abaixo constam do relato como **reconstruções normalizadas de anotações anteriores**. Não são transcrições literais autenticadas das conversas com Gemini. A versão exata dos prompts históricos somente poderá ser confirmada a partir dos registros originais.

| Fase | Exemplo documental | Finalidade |
|---|---|---|
| Prompt inicial | “Faça um script que varra arquivos por segredos.” | Solicitação genérica, sem requisitos arquiteturais suficientes |
| Prompt melhor especificado | “Crie uma CLI em Python puro sem dependências externas para ler arquivos e buscar padrões Regex de chaves AWS e de chaves privadas RSA. Utilize argparse e pathlib.” | Impor biblioteca padrão e delimitar padrões |
| Refinamento | “Reescreva o scanner usando exclusivamente a biblioteca padrão do Python (argparse, re, pathlib, os e sys), sem pip. Leia arquivos em UTF-8 com errors='ignore', trate PermissionError e OSError sem encerrar toda a varredura, mas registre a quantidade de arquivos não analisados. Não exiba valores de credenciais e forneça testes com dados sintéticos.” | Corrigir dependências inadequadas, melhorar robustez e testes |

**Análise crítica:** as anotações relatam sugestão de bibliotecas externas `click` e `colorama` após pedidos genéricos, em conflito com o requisito de zero dependências. Sem as respostas originais da IA, esta relação permanece como relato histórico do aluno, não como observação reexecutada.

## Revisão complementar documentada

Solicitação registrada para a revisão posterior: “Avalie o SecurePath CLI quanto à disponibilidade, funcionalidade, sustentabilidade e reprodutibilidade, verificando código, README, testes e tratamento de I/O; documente os problemas e correções.”

A revisão posterior atualizou a suíte para 11 testes, corrigiu o risco de bloqueio com FIFO e manteve cinco alertas na amostra sintética. Consulte [revisão crítica](REVISAO_IA.md), [relato completo](relato.txt) e [registro dos testes](evidencias/validacao_2026-11-05.txt).

## Limite da evidência

A identificação Gemini 1.5 Pro foi confirmada pelo aluno; a redação dos prompts antigos **não foi confirmada literalmente**. Os exemplos são adequados à análise metodológica desde que essa ressalva seja mantida. Não se devem fabricar logs, datas ou respostas de Gemini.


## Extensão posterior — solicitações e verificação

Na sequência de revisão com GPT-6, o aluno solicitou que o artefato não fosse excessivamente simplificado. A assistência implementou novas regras heurísticas, saída JSON e testes. Foram executados 16 testes em Linux com aprovação, e um projeto sintético com três arquivos produziu quatro alertas. Os resultados são de uma execução do assistente, não do Windows do aluno. A data, o provedor e a versão dessa etapa não substituem o histórico original do Gemini 1.5 Pro.
