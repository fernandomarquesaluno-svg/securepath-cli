# SecurePath — site interativo (versão 2)

Esta pasta contém o site de apresentação do SecurePath CLI. O projeto prioriza uma explicação visual do problema de vazamento de credenciais, antes de apresentar o funcionamento técnico.

## Recursos

- Hero com painel animado de detecção e alertas com valores ocultos.
- Explicação visual do problema, antes e depois da varredura.
- Passo a passo interativo das quatro etapas do algoritmo.
- Laboratório de simulação dos três cenários sintéticos documentados, com relatórios em texto e JSON.
- Explorador filtrável das sete regras SEC001 a SEC007.
- Arquitetura, evidências de testes, uso de IA, limites conhecidos e guia de execução.
- Layout responsivo e suporte à preferência por movimento reduzido.

O simulador do navegador **não executa o scanner Python**. Ele reproduz resultados esperados das amostras do repositório. O código real é executado localmente com Python 3.9+.

## Arquivos

- index.html — conteúdo e visualizações
- style.css — identidade visual e animações CSS
- app.js — interações e demonstrações simuladas

Não há instalação de pacotes no front-end. As fontes remotas são opcionais; há substitutos locais.

## GitHub Pages

Configure Settings > Pages > Deploy from a branch > main > /docs.
Site: https://fernandomarquesaluno-svg.github.io/securepath-cli/

O arquivo index.html na raiz oferece um redirecionamento alternativo para /docs/ caso a publicação seja configurada para a raiz do repositório.

## Fontes da documentação

README.md, artefatos.py, EVOLUCAO_TECNICA.md e evidencias/validacao_codespaces_2026-11-06.md. Os dados das demonstrações são estáticos e devem ser atualizados se o scanner mudar. Os números de testes se referem à validação documentada no Codespaces, não a um novo benchmark.

## Adendo de evolução técnica — 24/11/2026

A seção `#evolucao` documenta o commit `f2cb2597ac1ece010c6611c138f250ca5e67e565` e os testes do commit `7b5d22e7b7b290b345c6e22a119e5be4393253a7`. Inclui opções `--workers`, `--rules-file` e `--exclude-dir`, simulação conceitual interativa da configuração, histórico e próximos passos recomendados. Distingue 19 testes definidos de 16 testes historicamente aprovados, sem atribuir resultados não comprovados à versão ampliada. O vídeo narrado anterior é preservado como registro histórico.
