# SecurePath — Da ideia à evidência

Filme da Tarefa 11 de Fernando Marques para a LEAS, UNIPAMPA. A edição reúne a composição original e um epílogo de 66 segundos. O botão abaixo do vídeo dá acesso à animação original.

## Materiais

| Material | Origem e uso |
|---|---|
| Palco original | Onze cenas em `docs/index.html`, keyframes em `docs/style.css`, ordem e marcações em `docs/app.js`. O renderizador lê o palco do repositório. |
| Voz original | Dois WAV de Afonso em `docs/media`, presentes antes da edição. Duram 62,013333 s e 38,808413 s. O áudio é mantido no ritmo original. |
| Epílogo | Canvas 2D em `epilogo.html` e `motion.js`. A animação usa um relógio em segundos e composição quadro a quadro. `inicio.jpg` e `portfolio.jpg` são capturas das páginas reais. |
| Voz complementar | `faber.flac`, português brasileiro. Piper local, modelo **pt_BR-faber-medium**. O roteiro e o tempo real de cada tomada estão em `falas.json`. |
| Música e efeitos | `trilha.m4a` e `efeitos.m4a` separados. Síntese original em `som.py` com arpejos, acordes, digitação, confirmações, passagem entre cenas e assinatura final. |
| Legendas | `docs/media/securepath-semestre.vtt`, 36 segmentos. O MP4 também contém uma faixa selecionável em português. |
| Tipografia | Space Grotesk e DM Sans do Google Fonts, com licenças OFL na pasta `fontes`. |
| Especificações e testes | Ver `VALIDACAO.md`. |

## Ferramentas, modelos e planos

| Ferramenta | Versão / plano | Aplicação |
|---|---|---|
| ChatGPT com Codex em Work Mode | ChatGPT Plus informado no contexto da conta. Identificação disponível ao executor: Codex baseado em GPT-6. Variante, nível de esforço e versão do cliente não foram expostos nesta execução. | Edição do roteiro para síntese, código de animação, montagem, testes e integração. |
| HeyGen | Serviço remoto, cota mensal gratuita de voz. Voz pública Afonso – Warm & Resonant, ID `9ce5f601f9e04382bb26141d5a3f839d`. Versão do serviço e modelo das gravações históricas não informados. | Uma solicitação para o novo texto retornou HTTP 402, cota insuficiente. Nenhum áudio novo foi gerado nesse serviço. |
| Piper | piper-tts 1.8.0, ONNX Runtime 1.32.0, execução local gratuita | Uma produção do roteiro em 13 tomadas com a voz Faber, mediante autorização de Fernando. Texto fonético aplicado somente na síntese dos nomes. Cartão do modelo em `modelo-faber.md`. |
| Python | 3.12.14. NumPy 2.3.5, SciPy 1.17.0 e Pillow 13.0.0. Ambiente isolado de voz com NumPy 2.5.5. | Síntese musical, tempos e automação. |
| Chromium e Playwright | Chromium 140.0.7339.0, distribuído em @sparticuz/chromium 140.0.0. Playwright Python 1.62.0. Execução local. | Capturas da interface, renderização e testes de interação. |
| FFmpeg e ffprobe | 7.1.5-0+deb13u1. Execução local. | Codificação H.264 e AAC, conversão de áudio, mixagem, legendas e inspeção dos fluxos. |
| Git | 2.56.1 e integração GitHub da conta acadêmica. Plano GitHub não consultado. | Base, recuperação e publicação. |

## Direção e iterações

O mapa organiza três papéis físicos sobre uma mesa digital. O último papel vira um relatório ao lado do código real de busca. Os pontos de teste abrem três caminhos para os recursos do scanner. A mesma linha passa pelos documentos dos eventos e pelos pareceres do K-Agent. As imagens do site e do portfólio fecham o percurso.

As conclusões sobre K-Agent são as das atividades didáticas. O funcionamento observado, a comparação quantitativa necessária para reprodutibilidade e os selos oficiais do evento são tratados separadamente na documentação do portfólio. Referências utilizadas: a página da atividade 6 para os processos e as páginas integradas das atividades 7 e 8 para os pareceres.

**Instruções efetivamente recebidas.** “Preserve integralmente as cenas, narrações e animações existentes.” “Mostre um mapa mental sendo construído progressivamente, com ideias e conexões convergindo para o problema das credenciais expostas em código-fonte.” “Utilize apenas resultados comprovados ou devidamente registrados no repositório.” O texto solicitado para narração está integralmente representado pelas frases de `falas.json`. Autorização posterior: “Autorizar outra voz neural gratuita em português brasileiro, identificada nos créditos”.

Uma solicitação HeyGen, uma geração de voz local em 13 tomadas e uma composição de música e efeitos. Três etapas de revisão visual: prévia do filme, correção de tipografia no código e exportação com verificação explícita das dimensões. A geração visual foi programática, sem modelo de vídeo generativo. Os números de iterações das 11 cenas anteriores não estão registrados neste checkout.

## Reprodução

Partir do checkout completo em Linux com FFmpeg, libx264 e as versões acima. Os scripts usam a pasta de mídia do site. Os arquivos de áudio prontos e as imagens do site já estão incluídos. Instalar os TTF fornecidos para que o Chromium encontre as famílias no sistema.

```bash
cd producao/tarefa11
mkdir -p ~/.local/share/fonts
cp fontes/*.ttf ~/.local/share/fonts/
fc-cache ~/.local/share/fonts/
export CHROMIUM=/usr/bin/chromium
bash montar.sh
python validar.py
python reproduzir.py
```

Para gerar as capturas e o som novamente, executar `python capturas.py` e `python som.py`. Para sintetizar a fala, usar `python voz.py /caminho/faber.onnx` em ambiente com Piper, NumPy, SciPy e FFmpeg. Manter a configuração ao lado do modelo com o nome `faber.onnx.json`. O modelo está no repositório Hugging Face `rhasspy/piper-voices`, diretório `pt/pt_BR/faber/medium`. O SHA-256 do ONNX é `75e913eb463db0b6ac7ddf68d3e4c9ac19ace36dc3b710a81039b448352b8ffc` e o da configuração é `6b6801319e5a70aa4d75c63343515f55d1cd671ecd1ac511586bc16216812261`. A síntese da fala pode variar entre execuções. Para reproduzir a montagem entregue, preferir o FLAC arquivado e suas marcações.

A transição ocorre no quadro 3025 a 30 fps. A montagem acrescenta aproximadamente 12 ms de silêncio para alinhar a troca de capítulo ao quadro. A nova trilha e os efeitos começam no epílogo. O FFmpeg normaliza apenas a nova voz na mixagem, codifica o áudio final em AAC e move o índice MP4 para o início do arquivo para reprodução progressiva.

Para distribuição no Pages, `web.sh` faz uma codificação de vídeo em duas passagens a 365 kbit/s e copia as faixas de áudio e legenda. Isso mantém o filme completo em um único download.
