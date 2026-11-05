# Evolução técnica do SecurePath CLI — 05/11/2026

## Escopo e proveniência

O desenvolvimento original foi realizado com apoio do **Gemini 1.5 Pro**, conforme confirmação do aluno. A revisão complementar com **GPT-6** introduziu testes, correções de I/O e, posteriormente, a extensão demonstrada abaixo. Esses recursos não devem ser atribuídos retroativamente ao Gemini.

## Alterações da extensão

- **Sete regras heurísticas** com identificadores de SEC001 a SEC007. As regras anteriores são preservadas.
- Novos padrões: ID de acesso temporário AWS (ASIA), token GitHub clássico (ghp_) e cabeçalhos PEM/OpenSSH.
- **`--format json`**: relatório estruturado com schema_version, contadores e achados por arquivo/linha/regra, sem exibir o segredo.
- **Compatibilidade preservada**: formato textual e códigos de saída 0, 1 e 2.
- **16 testes unitários** (11 anteriores + cinco novos), verificados em Linux/Python 3.13.5 nesta revisão.
- Pasta `demonstracao/` com arquivos integralmente sintéticos para demonstrar múltiplos tipos de achados e um arquivo de controle negativo.

## Demonstração

```bash
python -m unittest discover -s tests -v
python artefatos.py demonstracao
python artefatos.py demonstracao --format json
python artefatos.py teste.txt --fail-on-findings
```

**Esperado:** 16 testes OK em ambiente Linux compatível; quatro alertas em três arquivos no diretório de demonstração; cinco alertas na base inicial; código 1 com `--fail-on-findings`.

## Limites científicos

Reconhecimento baseado em Regex pode gerar falsos positivos e negativos. O scanner não verifica se uma credencial está ativa; cabeçalhos de chave sem material criptográfico não representam uma chave real. Não houve avaliação formal de precisão, recall, sensibilidade ou generalização. Resultado de amostras sintéticas **não equivale** a validação em projetos reais.

O relatório JSON contém caminhos de arquivos e linhas, que podem ser sensíveis. O usuário deve evitar compartilhar relatórios gerados a partir de diretórios privados. O comportamento no Windows requer validação do aluno.
