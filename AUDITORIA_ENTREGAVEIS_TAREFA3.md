# Auditoria dos entregáveis — Atividade 3 (SecurePath CLI)

**Data:** 05/11/2026  
**Escopo:** confrontar o artefato com os entregáveis informados no enunciado da Atividade 3 — artefato de cibersegurança assistido por IA, repositório público e análise por Disponibilidade, Funcionalidade, Sustentabilidade e Reprodutibilidade.

## 1. Matriz de verificação

| Requisito | Evidência no repositório | Resultado |
|---|---|---|
| Artefato executável e problema concreto de Cibersegurança | [artefatos.py](artefatos.py); scanner heurístico de possíveis credenciais expostas | Documentado |
| Repositório público | Página principal do GitHub | Documentado |
| Código e instruções de instalação/execução | [README](README.md), seções 7–8 | Documentado |
| README com 13 tópicos fundamentais | [README](README.md), seções 1–13 | Documentado |
| Demonstração com amostra segura | [teste.txt](teste.txt), cinco padrões inteiramente sintéticos | Documentado |
| Testes automatizados | [tests/test_artefatos.py](tests/test_artefatos.py), 11 cenários na versão publicada | Documentado |
| Referências e licença | README, seção 13; [LICENSE](LICENSE), MIT | Documentado |
| Uso de IA na implementação | [relato.txt](relato.txt), seções 2, 3, 4 | Relatado; histórico original incompleto |
| Uso de IA na elaboração/revisão do README | [relato.txt](relato.txt), seção 2 | Relatado; versões originais a confirmar |
| Revisão pós-publicação pelos quatro critérios | [REVISAO_IA.md](REVISAO_IA.md) e relato, seção 7 | Documentada |
| TXT: link, modelos, prompts, decisões, revisão, reflexão | [relato.txt](relato.txt), seções 1–6 | Estrutura completa, comprovação histórica parcial |
| Evidência de execução recente | [validacao_2026-11-05.txt](evidencias/validacao_2026-11-05.txt) | 11 testes OK e cinco alertas documentados |
| Material de apresentação | [ROTEIRO_APRESENTACAO.md](ROTEIRO_APRESENTACAO.md) | Roteiro textual atualizado para 10 slides; PowerPoint fornecido separadamente |

## 2. Julgamento técnico dos quatro critérios

| Critério | Evidência | Limitação |
|---|---|---|
| Disponibilidade | Código-fonte, README, amostra, testes e licença no GitHub | Link público não equivale a arquivamento permanente certificado |
| Funcionalidade | 11 testes documentados e varredura sintética com cinco alertas | Cobertura restrita a padrões conhecidos; sem taxa de detecção de corpus real |
| Sustentabilidade | Biblioteca padrão, modularização e suíte de regressão | Ausência de avaliação independente de manutenção ou compatibilidade de plataformas |
| Reprodutibilidade | Comandos, entradas sintéticas, saídas esperadas e log | Reprodução do comportamento sintético, não de resultados de um artigo científico |

**Nota:** esses são critérios acadêmicos da tarefa, não selos formalmente concedidos pelo SBSeg ao SecurePath CLI.

## 3. Observações concretas da auditoria

1. O pacote **SecurePath_CLI_Entrega_Final.zip**, anteriormente gerado em 04/11/2026, possui **nove testes** e não contém as duas verificações de regressão para FIFO e links simbólicos introduzidas posteriormente. **Não utilizar esse ZIP como snapshot final do projeto.** O repositório GitHub, atualizado em 05/11/2026, é a versão de referência.
2. O log de 05/11/2026 apresenta prefixos de comando truncados na transcrição textual: `$ -m unittest...` e `$ artefatos.py...`. Os comandos completos para reprodução são `python -m unittest discover -s tests -v` e `python artefatos.py teste.txt --fail-on-findings`; conferir a [nota de transcrição](evidencias/NOTA_TRANSCRICAO.md). A saída registrada não foi reatribuída a um operador humano.
3. A versão pública registra 11 testes aprovados em Python 3.12.14/Linux. Como conferência adicional, nesta revisão foi executada uma **cópia local reconstruída**: partiu-se do ZIP de 04/11 e aplicaram-se a verificação de arquivo regular e os dois testes de regressão inspecionados no GitHub. Em Python 3.13.5/Linux, 11/11 testes passaram e a amostra produziu cinco alertas e código 1. **Essa verificação não é uma clonagem autenticada do último commit.**
4. O relato original apresenta divergências entre Gemini, GPT-4o e Claude, e não preserva as transcrições necessárias para identificar os modelos/versões históricos por etapa. Os prompts descritos foram **reconstruídos**, não são transcrições autenticadas.
5. A apresentação revisada foi reorganizada em dez slides, para explicitar uso de IA nas três etapas, refinamento de prompts, decisões humanas, testes, critérios e limites. O arquivo PowerPoint foi disponibilizado nesta conversa, não publicado automaticamente neste repositório.

## 4. Pendências que exigem comprovação pelo aluno

- Confirmar **modelo, versão e provedor** realmente utilizados no desenvolvimento, na redação do README e na revisão; corrigir divergências com base no histórico, sem inventar interações.
- Substituir os prompts reconstruídos por exemplos **literalmente utilizados**, quando houver registros, ou mantê-los explicitamente como reconstruções.
- Reproduzir os comandos da versão GitHub no próprio computador e registrar **data, sistema operacional, versão de Python, comandos e saídas**, indicando o operador.
- Validar em primeira pessoa a seção de decisões humanas e a reflexão crítica de [relato.txt](relato.txt).
- Se for necessário entregar um ZIP ou PPTX como arquivo, gerar o pacote a partir do **estado mais recente do GitHub**, e não reutilizar o ZIP de 04/11.

## 5. Conclusão

**Situação: tecnicamente muito próxima da conclusão.** Artefato, documentação, licença, testes e revisão crítica estão documentados. A entrega não deve ser declarada integralmente comprovada até fechar o histórico do uso de IA e a validação pessoal do estudante.
