# Validação no GitHub Codespaces — 06/11/2026

## Proveniência

Registro transcrito das saídas do terminal **enviadas pelo aluno nesta conversa** em 06/11/2026.
Ambiente indicado no prompt: `/workspaces/securepath-cli (main)` — GitHub Codespaces, imagem padrão (Linux), Python 3.14.2.

**Natureza da evidência:** relato e transcrição fornecidos pelo aluno. O assistente analisou o texto encaminhado, mas não operou o terminal do Codespaces nem conferiu o hash do checkout. A saída foi colada duas vezes na mensagem, não devendo ser interpretada como duas execuções independentes.

## Comandos executados (Linux)

```bash
python3 --version
python3 -m unittest discover -s tests -v
python3 artefatos.py demonstracao
python3 artefatos.py demonstracao --format json
```

Os comandos `py -3` tentados inicialmente retornaram `bash: py: command not found`, porque o launcher `py` é típico do Windows; a execução foi refeita corretamente com `python3`.

## Resultado da suíte de testes

```text
Python 3.14.2
test_additional_credential_types_detected ... ok
test_binary_file_is_skipped ... ok
test_clean_file_has_no_alerts ... ok
test_default_text_output_remains_compatible ... ok
test_detects_five_synthetic_findings_without_revealing_values ... ok
test_directory_io_error_is_reported_and_scan_continues ... ok
test_directory_scan_ignores_git_folder ... ok
test_fifo_does_not_block_directory_scan ... ok
test_json_clean_result_is_machine_readable ... ok
test_json_output_is_structured_and_redacted ... ok
test_large_file_is_skipped ... ok
test_non_utf8_file_does_not_crash ... ok
test_permission_error_does_not_abort_scan ... ok
test_short_similar_strings_do_not_match_new_rules ... ok
test_symlink_is_skipped_without_reading_target ... ok
test_unavailable_path_returns_argument_error ... ok

----------------------------------------------------------------------
Ran 16 tests in 0.086s

OK
```

## Demonstração no diretório sintético

```text
[ALERTA] demonstracao/chave_exemplo.txt:2 | Cabeçalho de chave privada PEM/OpenSSH
[ALERTA] demonstracao/configuracao.py:2 | AWS Temporary Access Key ID
[ALERTA] demonstracao/configuracao.py:3 | GitHub personal access token (clássico)
[ALERTA] demonstracao/configuracao.py:4 | Senha/segredo atribuído

Resumo: arquivos analisados=3 | ignorados=0 | erros de I/O=0 | alertas=4
```

Resumo do JSON retornado:

```json
{
  "schema_version": "1.0",
  "scanner": "SecurePath CLI",
  "summary": {
    "examined": 3,
    "skipped": 0,
    "io_errors": 0,
    "findings": 4
  },
  "finding_rule_ids": ["SEC007", "SEC005", "SEC006", "SEC004"]
}
```

**Nota:** `finding_rule_ids` é uma síntese documental da lista `findings` exibida no terminal, não uma chave literal do JSON produzido pela aplicação. O relatório completo contém `rule_id`, `category`, `path` e `line` por ocorrência, sem valores detectados.

## Interpretação

- 16/16 testes concluíram com `ok`, incluindo o teste FIFO dependente de POSIX.
- Três arquivos sintéticos foram analisados e produziram quatro alertas esperados, sem erros de I/O.
- A saída JSON é estruturalmente coerente com os achados apresentados em modo texto.
- Esses resultados demonstram o comportamento da amostra e o sucesso dos testes em Codespaces, **não** métricas de precisão/recall em código real nem garantia de ausência de segredos.
- **Não é uma validação do Windows.** O modelo de IA original e os prompts históricos devem continuar sendo descritos conforme o relato e suas ressalvas.

## Critérios da atividade

- Disponibilidade: repositório GitHub público.
- Funcionalidade: CLI e suíte de testes executadas conforme transcrição apresentada pelo aluno.
- Sustentabilidade: código em Python Standard Library, regras separadas e testes.
- Reprodutibilidade: comandos, ambiente e resultados transcritos neste registro; terceiros podem refazer o procedimento.

**Status acadêmico:** evidência complementar para a entrega, sujeita à verificação do professor. O estudante ainda deve confirmar a autoria e fidelidade do relato de uso de IA e realizar a submissão.
