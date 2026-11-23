# Site interativo — SecurePath Atlas

Site estático e responsivo para apresentar o artefato SecurePath CLI, inspirado no Atlas de Evidências.

## Conteúdo

- Página inicial com apresentação e indicadores fundamentados na documentação.
- Mapa de processamento clicável: entrada → filtros → detecção → relatório.
- Laboratório com **simulação visual** de três exemplos sintéticos e saídas texto/JSON.
- Explorador das sete regras SEC001–SEC007.
- Visão da arquitetura, códigos de saída, testes, evidências e limites conhecidos.
- Guia de instalação com comandos para Linux/macOS e Windows.

**Distinção importante:** a demonstração no navegador é apenas uma reconstituição visual de resultados documentados. Ela não executa Python nem acessa arquivos locais. Para analisar código de verdade, execute o script na máquina do usuário.

## Executar localmente

Abra o arquivo docs/index.html no navegador. Não há build, npm, framework ou serviço necessário. HTML, CSS e JavaScript estão disponíveis no diretório docs/. A fonte web externa é opcional; fontes locais funcionam se não houver conexão.

## Publicar gratuitamente no GitHub Pages

1. Abra o repositório no GitHub.
2. Vá em **Settings → Pages**.
3. Em **Build and deployment**, selecione **Deploy from a branch**.
4. Selecione **main**, pasta **/docs**, e clique em **Save**.
5. Após o processamento do GitHub, o endereço previsto é:
   https://fernandomarquesaluno-svg.github.io/securepath-cli/

A página de configuração precisa ser ativada por quem tem acesso às configurações do repositório. O endereço acima não é uma confirmação de que a publicação já está ativa.

## Arquivos

- index.html — estrutura, textos e navegação
- style.css — identidade visual Midnight Aurora, animações e responsividade
- app.js — navegação, regras clicáveis, simulação e instalação

O site respeita a preferência do sistema por movimento reduzido, possui estados de foco e funciona sem dependências JavaScript de terceiros.

## Proveniência

Os dados foram adaptados de README.md, artefatos.py, EVOLUCAO_TECNICA.md e evidencias/validacao_codespaces_2026-11-06.md da mesma revisão do projeto. Alterações futuras do scanner devem ser refletidas nos dados estáticos do site.