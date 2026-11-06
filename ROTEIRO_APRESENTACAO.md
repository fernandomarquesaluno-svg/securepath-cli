# Roteiro final — Atividade 3 (SecurePath CLI)

**Revisão:** 06/11/2026. **Formato final de apresentação:** 9 slides, aproximadamente 5 minutos. Os arquivos PPTX, PDF e roteiro de fala foram produzidos separadamente para entrega.

1. **Capa — SecurePath CLI.** Scanner local de possíveis credenciais expostas; não verifica se credenciais estão ativas.
2. **Problema e proposta.** Exposição acidental de segredos em repositórios e arquivos; detecção heurística offline.
3. **Fluxo técnico.** Arquivo/diretório → filtros para tamanho/binário/links → 7 regras Regex → saída texto/JSON.
4. **O que é detectado.** Chaves AWS AKIA/ASIA, Bearer, token clássico GitHub, atribuições de senha/segredo e cabeçalhos de chaves privadas.
5. **Demonstração reproduzível.** Em Codespaces/Linux, usar `python3 artefatos.py demonstracao` e `python3 artefatos.py demonstracao --format json`. Evidência registrada: 3 arquivos, 4 alertas e 0 erros de I/O.
6. **Testes.** `python3 -m unittest discover -s tests -v`; evidência enviada pelo aluno em 06/11/2026: Python 3.14.2, 16 testes aprovados em Linux.
7. **Apoio de IA.** Gemini 1.5 Pro no desenvolvimento original, conforme declaração do aluno; GPT-6 na revisão e extensão posterior. Prompts históricos foram reconstruídos e não são transcrições comprovadas. Ressaltar as decisões humanas e a crítica às sugestões da IA.
8. **Quatro critérios.** Disponibilidade (repositório público), Funcionalidade (teste sintético), Sustentabilidade (Python padrão/modularização) e Reprodutibilidade (comandos/entradas/logs). Não apresentar como selos oficiais.
9. **Conclusões e limites.** O scanner encontra indícios sintéticos sem revelar valores; Regex pode produzir falsos positivos/negativos, e a validação Windows e avaliação em corpus real não foram comprovadas.

## Demonstrar, se houver tempo

```bash
python3 -m unittest discover -s tests -v
python3 artefatos.py demonstracao
python3 artefatos.py demonstracao --format json
```

No Windows, `py -3` pode substituir `python3`, mas **não declarar validação no Windows** sem execução real. Os testes de FIFO dependem de POSIX e podem ser ignorados no Windows.

## Estado de entrega

- Código, README, licença, amostras, testes, relato crítico, auditoria e log do Codespaces estão documentados no repositório.
- Slides e PDF do roteiro estão em arquivo separado, para anexar à submissão se solicitado.
- A confirmação do relato histórico de IA e a submissão oficial dependem do aluno.
