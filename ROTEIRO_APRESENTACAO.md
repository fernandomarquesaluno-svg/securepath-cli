# Roteiro de apresentação — SecurePath CLI

**Sugestão:** 8 slides, aproximadamente 6–7 minutos. Texto preparado para leitura em tom profissional e natural. O roteiro reflete os arquivos revisados, sem alegar que o projeto recebeu selos oficiais do SBSeg.

## Slide 1 — SecurePath CLI: análise estática de credenciais com Python puro
**Na tela:** título, descrição curta, repositório GitHub.

**Fala:** “Este trabalho apresenta o SecurePath CLI, uma ferramenta de linha de comando para identificar possíveis credenciais expostas em arquivos de código e de configuração. O objetivo foi resolver um problema concreto de cibersegurança com uma implementação pequena, auditável e que pudesse ser reproduzida por outra pessoa. Desenvolvi o artefato com apoio de inteligência artificial, mas mantive as decisões de arquitetura, testes e validação sob minha responsabilidade.”

## Slide 2 — Problema e objetivo
**Na tela:** exposição de segredos; detecção local; escopo limitado.

**Fala:** “O problema é o vazamento acidental de informações como identificadores de acesso, tokens e chaves privadas em repositórios. O SecurePath faz uma varredura local e aponta indícios de exposição antes que o código seja compartilhado. Ele não comprova que um segredo seja válido, não revoga chaves e não substitui uma plataforma completa de segurança. Esse limite de escopo foi intencional, para garantir um artefato executável e avaliável.”

## Slide 3 — Arquitetura e funcionamento
**Na tela:** arquivo/diretório → leitura tolerante → regex → alertas e resumo.

**Fala:** “A arquitetura utiliza exclusivamente a biblioteca padrão do Python. O argparse trata os argumentos da CLI; pathlib e os fazem o acesso aos arquivos e diretórios; e o módulo re executa os padrões de detecção. O processo é simples: eu informo um caminho, o scanner percorre os arquivos e procura padrões de chave AWS, token Bearer, cabeçalho RSA e atribuições de senhas. A saída informa arquivo, linha e categoria, sem imprimir o segredo encontrado.”

## Slide 4 — Como conduzi o uso de IA
**Na tela:** solicitação inicial → resposta → análise crítica → prompt refinado → testes.

**Fala:** “A inteligência artificial foi usada na geração do código, na documentação e na revisão. Uma dificuldade registrada foi que prompts muito genéricos levaram à sugestão de bibliotecas externas, como click e colorama. Isso contrariava um requisito que eu havia definido: zero dependências. Por isso, refinei os prompts para exigir apenas a Standard Library, tratamento explícito de erros de I/O e testes com valores sintéticos. O ponto principal aqui não foi aceitar a primeira resposta, mas impor restrições e validar o resultado.”

## Slide 5 — Decisões humanas e resiliência de I/O
**Na tela:** errors='ignore'; PermissionError/OSError; binários; limites e logs.

**Fala:** “A principal decisão técnica foi evitar que um único arquivo problemático interrompesse toda a análise. A leitura de texto usa UTF-8 com errors igual a ignore e os erros de permissão ou sistema de arquivos são registrados, permitindo continuar a varredura. Para arquivos provavelmente binários, implementei uma heurística de byte nulo no início, além de limite de tamanho e exclusão de links simbólicos. É importante reconhecer que essas escolhas favorecem robustez operacional, mas também podem causar falsos negativos. Por isso, os arquivos ignorados são contabilizados e as limitações estão documentadas.”

## Slide 6 — Demonstração e testes reproduzíveis
**Na tela:** `python artefatos.py teste.txt`; `python -m unittest discover -s tests -v`.

**Fala:** “Para demonstrar a ferramenta, preparei um dataset inteiramente sintético, que permite executar a análise sem usar nenhuma credencial real. O comando de demonstração identifica cinco alertas no arquivo de teste. Além disso, executei nove testes automatizados com unittest, todos aprovados no ambiente local. Eles incluem casos de arquivo limpo, binário, codificação inválida, erro de permissão simulado e falha de travessia de diretórios. Assim, a reprodução não depende apenas da minha descrição: outra pessoa pode executar os mesmos comandos e comparar os resultados.”

## Slide 7 — Avaliação pelos quatro critérios
**Na tela:** tabela Disponibilidade / Funcionalidade / Sustentabilidade / Reprodutibilidade.

**Fala:** “A análise crítica foi orientada pelos quatro critérios previstos na atividade. A disponibilidade é demonstrada pelo repositório público e pela documentação. A funcionalidade é apoiada pela execução da CLI e pelos testes. A sustentabilidade está no código pequeno, organizado em funções e sem dependências externas. A reprodutibilidade é sustentada pelos comandos, dados sintéticos e resultados esperados. Esses elementos apoiam a avaliação, mas não representam uma atribuição oficial de selos.”

## Slide 8 — Limitações, aprendizado e conclusão
**Na tela:** falsos positivos; falsos negativos; validação humana; próximas melhorias.

**Fala:** “O principal limite técnico é que expressões regulares detectam padrões, e não o contexto completo de segurança. Portanto, podem ocorrer falsos positivos e falsos negativos. O aprendizado mais importante do trabalho foi sobre a gestão da IA no desenvolvimento: ela acelerou implementação e documentação, mas também sugeriu soluções inadequadas e deixou lacunas. A qualidade só melhorou com definição de critérios, revisão crítica e testes. Como continuidade, eu ampliaria os padrões e avaliaria o comportamento em diferentes sistemas operacionais, mantendo o mesmo cuidado com rastreabilidade e validação.”

## Demonstração curta recomendada (antes ou depois do slide 6)

```bash
python artefatos.py teste.txt
python -m unittest discover -s tests -v
```

**Frase de encerramento:** “O SecurePath CLI mostra que um artefato de segurança pode ser pequeno e, ainda assim, ter documentação, testes, limites explícitos e um processo de desenvolvimento com IA auditável.”

> **Observação de fidelidade:** as anotações de IA disponíveis divergem sobre o histórico de modelos: o PDF indica Gemini, enquanto o relato antigo do GitHub também menciona GPT-4o e Claude. Não cite nomes e versões de modelos na apresentação além dos que conseguir confirmar nos registros originais.