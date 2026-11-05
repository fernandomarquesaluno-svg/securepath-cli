# Entrega da Atividade 3 — como executar

A entrega principal é o artefato Python executável em [artefatos.py](artefatos.py). **Não há exigência técnica de gerar um executável .exe**, desde que o docente aceite script ou CLI, como previsto no enunciado.

## Windows (no computador do aluno)

1. Baixe o repositório em **Code → Download ZIP** e descompacte.
2. Instale Python 3.9 ou superior, se necessário.
3. Execute `executar_windows.bat` para uma demonstração com dados exclusivamente sintéticos.
4. Abra o terminal na pasta do projeto e rode:

```powershell
py -3 --version
py -3 -m unittest discover -s tests -v
py -3 artefatos.py teste.txt --fail-on-findings
```

Se `py -3` não estiver disponível, tente `python` no lugar.

## Resultados esperados

- 11 cenários no código de testes; alguns testes específicos de POSIX poderão ser pulados no Windows.
- Cinco alertas no `teste.txt`, sem impressão dos valores identificados.
- Código de saída 1 com `--fail-on-findings`, porque a amostra contém padrões suspeitos intencionalmente. Esse resultado não significa erro do programa.
- Nenhuma conexão externa é necessária na execução.

O iniciador `executar_windows.bat` foi escrito como conveniência, **mas ainda não foi testado em Windows**. A revisão documentada em Linux não é equivalente à validação no ambiente do aluno.

## Registro da execução pessoal

Registre a data, o sistema operacional, a versão do Python e as saídas dos comandos anteriores. Não use os logs da execução pelo assistente como se fossem testes realizados por você.

## Demais entregáveis

- [README técnico](README.md)
- [Relato de desenvolvimento assistido por IA](relato.txt)
- [Registro dos prompts e suas limitações](PROMPTS_REGISTRADOS.md)
- [Auditoria de entregáveis](AUDITORIA_ENTREGAVEIS_TAREFA3.md)
- [Roteiro de apresentação](ROTEIRO_APRESENTACAO.md)

**Histórico do uso de IA:** Gemini 1.5 Pro no desenvolvimento original (confirmado pelo aluno) e GPT-6 na revisão complementar. Os prompts originais não foram recuperados literalmente.
