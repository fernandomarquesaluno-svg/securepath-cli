# Roteiro — Atividade 3, versão ampliada (11 slides)

**Revisão:** 05/11/2026. **Formato:** 11 slides com demonstração prática. Os resultados abaixo são testes executados pelo assistente em Linux.

1. **SecurePath CLI:** apresentar o scanner SAST local e o objetivo de identificar indícios de segredos.
2. **Problema e objetivo:** vazamento acidental de credenciais e limite entre indício e validação de chave ativa.
3. **Arquitetura:** arquivo/diretório → filtros → sete regras Regex → texto/JSON; biblioteca padrão Python.
4. **Regras SEC001–SEC007:** AWS AKIA, Bearer, cabeçalho RSA, atribuição de senha, AWS ASIA, GitHub clássico, PEM/OpenSSH.
5. **Relatórios:** sem mostrar valores, produzir caminho, linha, categoria, identificador e resumo. Explicar uso de `--format json`.
6. **IA em três etapas:** desenvolvimento inicial com Gemini 1.5 Pro (confirmado pelo aluno); revisão técnica e ampliação posterior com GPT-6.
7. **Prompts e decisões:** mostrar um exemplo reconstruído de pedido genérico e um refinado, sem afirmar que são transcrições autenticadas.
8. **Testes:** 16/16 aprovados em Linux; quatro achados sintéticos na pasta de demonstração; zero erros de I/O.
9. **Quatro critérios:** disponibilidade, funcionalidade, sustentabilidade e reprodutibilidade, sem atribuir selos oficiais.
10. **Demonstração ao vivo:** usar os três comandos abaixo, preferencialmente já testados no Windows antes de apresentar.
11. **Conclusões:** resultados e limites de Regex, falsos positivos/negativos e histórico de IA registrado de modo transparente.

## Comandos da demonstração

```powershell
py -3 artefatos.py demonstracao
py -3 artefatos.py demonstracao --format json
py -3 -m unittest discover -s tests -v
```

**Observação:** o teste FIFO depende de POSIX e poderá aparecer como `skipped` no Windows. Não declarar 16 testes aprovados no Windows até executar e registrar as saídas reais.
**Tempo de apresentação:** ajuste a fala à duração determinada pelo professor; priorize demonstração e evidências.