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