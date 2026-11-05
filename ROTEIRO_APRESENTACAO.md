# Roteiro revisado — Apresentação da Atividade 3

**Artefato:** SecurePath CLI — Scanner estático de possíveis credenciais expostas  
**Estrutura:** 10 slides; sugestão de duração: 6 a 8 minutos.  
**Premissa:** conteúdo baseado no enunciado da Atividade 3 e nas evidências disponíveis. Não afirmar concessão de selos oficiais.

## 1. SecurePath CLI

“Apresento o SecurePath CLI, uma ferramenta local em Python para identificar possíveis credenciais expostas em arquivos de código e configuração. O desenvolvimento contou com apoio de inteligência artificial, mas o objetivo principal foi produzir um artefato simples, auditável e testável.”

## 2. Problema e objetivo

“Senhas, tokens e chaves privadas podem acabar publicados em repositórios. Minha ferramenta percorre arquivos e identifica padrões suspeitos, mostrando caminho, linha e categoria. Ela não confirma se uma credencial é válida.”

## 3. Arquitetura técnica

“A entrada é um arquivo ou diretório. O programa faz a varredura usando a biblioteca padrão do Python, aplica expressões regulares e gera alertas e contadores. Não depende de serviços externos. Arquivos especiais e itens grandes ou provavelmente binários são tratados de forma conservadora.”

## 4. IA em três etapas

“O enunciado exige IA em três momentos: desenvolvimento e testes, geração ou revisão do README e revisão crítica depois da publicação. Na etapa original utilizei Gemini 1.5 Pro; depois, o GPT-6 auxiliou uma revisão complementar. Os prompts históricos completos ainda precisam ser preservados.”

## 5. Prompts e refinamento

“Um pedido muito genérico — fazer um script para buscar segredos — não definiu as restrições e, segundo as anotações, levou a sugestões de bibliotecas externas. O refinamento passou a exigir Python puro, tratamento de falhas e dados sintéticos. Os textos de prompts no relato são reconstruções; não são transcrições auditadas.”

## 6. Decisões e correções

“O escopo foi restringido para um scanner heurístico. A saída não apresenta o valor encontrado. Também foi necessário tratar falhas de entrada e saída para uma ocorrência não interromper toda a varredura. Na revisão posterior, foi corrigido o risco de bloqueio ao acessar arquivos FIFO e criados testes específicos.”

## 7. Testes executados

“O repositório registra onze testes aprovados em Linux. A amostra fictícia produz cinco alertas e nenhum erro de leitura. O código um, com a opção fail-on-findings, indica que foram encontrados alertas, não uma falha inesperada.”

## 8. Quatro critérios

“Disponibilidade vem do repositório e da documentação. Funcionalidade, dos testes. Sustentabilidade, da organização e ausência de dependências de terceiros. Reprodutibilidade, dos comandos, dos dados sintéticos e das saídas previstas. Não estou atribuindo selos oficiais.”

## 9. Limitações

“Regex detecta padrões, e não o contexto completo. Pode haver falsos positivos e falsos negativos. Não medi precisão ou recall em projetos reais, nem validei a execução em Windows ou macOS. A versão do modelo original foi confirmada, mas os prompts históricos ainda não foram auditados.”

## 10. Conclusão e entregáveis

“O trabalho reúne código público, testes, README, licença, relato crítico e protocolo de reprodução. O aprendizado principal é que a IA acelera a implementação, mas não elimina a necessidade de especificar requisitos, verificar propostas e testar. Antes da entrega definitiva, preciso conferir meus prompts históricos e executar a versão final no meu ambiente.”

## Demonstração sugerida

```bash
python -m unittest discover -s tests -v
python artefatos.py teste.txt --fail-on-findings
```

Se a demonstração for feita em Windows e o comando `python` não existir, tentar `py -3`. Registrar o sistema, a versão e as saídas; o status do último comando deve ser 1 devido aos cinco alertas sintéticos.

**Código:** https://github.com/fernandomarquesaluno-svg/securepath-cli
